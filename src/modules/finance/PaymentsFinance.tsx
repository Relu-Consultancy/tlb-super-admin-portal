import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    Search,
    Plus,
    Download,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CheckCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    FileText,
    CreditCard,
    Receipt,
    Building2,
    User,
    Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import Select from '../../shared/components/ui/Select';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listTransactions,
    getTransaction,
    registerPayment,
    queueTransactionExport,
    getTransactionExportJob,
    downloadTransactionExport,
    sourceLabel,
    sourceTone,
    paymentModeLabel,
    bookingTypeLabel,
    parseAmount,
    formatMoney,
    PAYMENT_MODES,
    TRANSACTION_SOURCES,
    BOOKING_TYPES,
    ApiError,
    type TransactionListItem,
    type TransactionDetail,
    type ListTransactionsParams,
} from '../../shared/lib/api';
import {
    resolvePeriodParams,
    STANDARD_PRESET_PERIODS,
    STANDARD_PERIOD_LABELS,
    type StandardPeriod,
} from '../../shared/lib/period';

const PAGE_SIZE = 20;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

const TABS = ['Transactions', 'Payouts', 'Refunds'] as const;
type Tab = (typeof TABS)[number];
type Toast = { type: 'success' | 'error'; text: string } | null;

const PaymentsFinance = () => {
    const { hasPermission } = useAuth();
    const canView = hasPermission('VIEW_TRANSACTIONS');
    const canRecord = hasPermission('RECORD_PAYMENTS');
    const canExport = hasPermission('EXPORT_REPORTS');

    const [activeTab, setActiveTab] = useState<Tab>('Transactions');

    // List + filters
    const [rows, setRows] = useState<TransactionListItem[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [period, setPeriod] = useState('');
    const [source, setSource] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [bookingType, setBookingType] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [ordering, setOrdering] = useState('-created_at');

    // Detail + register
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<TransactionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState<Toast>(null);
    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const buildParams = useCallback((): ListTransactionsParams => ({
        search: debouncedSearch || undefined,
        // Empty = "Any period"; otherwise resolve the standard filter (rolling
        // windows become a custom date range).
        ...(period ? resolvePeriodParams(period as StandardPeriod) : {}),
        source: source || undefined,
        payment_mode: paymentMode || undefined,
        booking_type: bookingType || undefined,
        min_amount: minAmount || undefined,
        max_amount: maxAmount || undefined,
        ordering,
    }), [debouncedSearch, period, source, paymentMode, bookingType, minAmount, maxAmount, ordering]);

    const loadRows = useCallback(async () => {
        if (!canView) return;
        setLoading(true);
        setError(null);
        try {
            const res = await listTransactions({ ...buildParams(), page, page_size: PAGE_SIZE });
            setRows(res.results ?? []);
            setCount(res.count ?? 0);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load transactions.');
        } finally {
            setLoading(false);
        }
    }, [canView, buildParams, page]);

    useEffect(() => { if (activeTab === 'Transactions') loadRows(); }, [activeTab, loadRows]);
    // Reset to page 1 when filters change.
    useEffect(() => { setPage(1); }, [period, source, paymentMode, bookingType, minAmount, maxAmount, ordering]);

    const money = (v: string | number | null | undefined, cur = 'INR') => formatMoney(parseAmount(v) ?? 0, cur);

    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            setDetail(await getTransaction(id));
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load transaction.');
            setSelectedId(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const openDetail = (tx: TransactionListItem) => {
        setSelectedId(tx.transaction_id);
        setDetail(null);
        loadDetail(tx.transaction_id);
    };

    const handleExport = async () => {
        setExporting(true);
        setToast(null);
        try {
            let job = await queueTransactionExport(buildParams());
            const isDone = (s: string) => s === 'done';
            const isFailed = (s: string) => s === 'failed';
            for (let i = 0; i < 40 && !isDone(job.status) && !isFailed(job.status); i++) {
                await delay(2000);
                job = await getTransactionExportJob(job.job_id);
            }
            if (isFailed(job.status)) { flash('error', job.error || 'Export failed on the server.'); return; }
            if (!isDone(job.status)) { flash('error', 'Export is taking longer than expected — try again shortly.'); return; }
            const blob = await downloadTransactionExport(job.job_id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'transactions.csv';
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            flash('success', `Exported ${job.row_count} transactions.`);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not export transactions.');
        } finally {
            setExporting(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    if (!canView) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>
                <EmptyState icon={AlertCircle} title="No access" description="You need the View Transactions permission to see payments." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>
                <div className="flex border-b border-gray-200">
                    {TABS.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-6 py-3 text-sm font-medium transition-all relative', activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600')}>
                            {tab}
                            {activeTab === tab && <motion.div layoutId="payTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
                        </button>
                    ))}
                </div>
            </header>

            {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

            {activeTab !== 'Transactions' ? (
                <Card><EmptyState icon={Receipt} title={`${activeTab} coming soon`} description={`The ${activeTab} tab will be wired once its API ships (Phase 2).`} /></Card>
            ) : (
                <>
                    {/* Search + actions */}
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <input type="text" placeholder="Search by transaction ID, booking ref, Razorpay ID, or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                        <div className="flex gap-2">
                            {canRecord && (
                                <button onClick={() => setRegisterOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-sm transition-all">
                                    <Plus size={16} /> Register
                                </button>
                            )}
                            {canExport && (
                                <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60">
                                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <Select value={period} onChange={setPeriod} placeholder="Any period" options={[{ value: '', label: 'Any period' }, ...STANDARD_PRESET_PERIODS.map(p => ({ value: p, label: STANDARD_PERIOD_LABELS[p] }))]} />
                        <Select value={source} onChange={setSource} placeholder="Any source" options={[{ value: '', label: 'Any source' }, ...TRANSACTION_SOURCES.map(s => ({ value: s, label: sourceLabel(s) }))]} />
                        <Select value={paymentMode} onChange={setPaymentMode} placeholder="Any mode" options={[{ value: '', label: 'Any mode' }, ...PAYMENT_MODES.map(m => ({ value: m.value, label: m.label }))]} />
                        <Select value={bookingType} onChange={setBookingType} placeholder="Any type" options={[{ value: '', label: 'Any type' }, ...BOOKING_TYPES.map(b => ({ value: b, label: bookingTypeLabel(b) }))]} />
                        <input type="number" placeholder="Min ₹" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        <input type="number" placeholder="Max ₹" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        <Select value={ordering} onChange={setOrdering} placeholder="Sort" options={[{ value: '-created_at', label: 'Newest' }, { value: 'created_at', label: 'Oldest' }, { value: '-amount', label: 'Amount ↓' }, { value: 'amount', label: 'Amount ↑' }]} />
                    </div>

                    {/* Table */}
                    <Card className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User / Partner</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={7}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                                    ) : error ? (
                                        <tr><td colSpan={7}><EmptyState icon={AlertCircle} title="Couldn't load transactions" description={error} /></td></tr>
                                    ) : rows.length === 0 ? (
                                        <tr><td colSpan={7}><EmptyState icon={FileText} title="No transactions found" description="No successful payments match the current filters." /></td></tr>
                                    ) : (
                                        rows.map((tx) => (
                                            <tr key={tx.transaction_id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openDetail(tx)}>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.transaction_id.slice(0, 8)}…</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{tx.customer_email || '—'}</p>
                                                    <p className="text-[11px] text-gray-400">{tx.partner_name || '—'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{money(tx.amount, tx.currency)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', sourceTone(tx.source))}>{sourceLabel(tx.source)}</span>
                                                    {tx.source === 'manual' && tx.payment_mode && <p className="text-[10px] text-gray-400 mt-1">{paymentModeLabel(tx.payment_mode)}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600">
                                                    {tx.booking_reference || '—'}
                                                    {tx.booking_type && <span className="ml-1 text-gray-400">· {bookingTypeLabel(tx.booking_type)}</span>}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(tx.date)}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={(e) => { e.stopPropagation(); openDetail(tx); }} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg"><Eye size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-xs text-gray-500">{count.toLocaleString()} transaction{count === 1 ? '' : 's'} · page {page} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50"><ChevronLeft size={14} /> Prev</button>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50">Next <ChevronRight size={14} /></button>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {/* Detail slide-over */}
            <AnimatePresence>
                {selectedId && (
                    <TransactionDetailPanel loading={detailLoading} detail={detail} money={money} onClose={() => { setSelectedId(null); setDetail(null); }} />
                )}
            </AnimatePresence>

            {/* Register modal */}
            <AnimatePresence>
                {registerOpen && (
                    <RegisterModal
                        onClose={() => setRegisterOpen(false)}
                        onRegistered={() => { setRegisterOpen(false); flash('success', 'Payment registered and booking confirmed.'); loadRows(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Detail slide-over
// ---------------------------------------------------------------------------

function TransactionDetailPanel({ loading, detail, money, onClose }: {
    loading: boolean; detail: TransactionDetail | null; money: (v: string | number | null | undefined, cur?: string) => string; onClose: () => void;
}) {
    const pd = detail?.payment_detail;
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }} className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-gray-900">Transaction</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full"><X size={20} className="text-gray-400" /></button>
                </div>
                {loading && !detail ? (
                    <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={26} /></div>
                ) : !detail ? (
                    <div className="p-6"><EmptyState icon={AlertCircle} title="Not found" description="Transaction could not be loaded." /></div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="text-center py-4 bg-gray-50 rounded-2xl">
                            <p className="text-3xl font-bold text-gray-900">{money(detail.amount, detail.currency)}</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', sourceTone(detail.source))}>{sourceLabel(detail.source)}</span>
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-green-50 text-green-600">{detail.status}</span>
                            </div>
                            <p className="font-mono text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1"><Hash size={10} /> {detail.transaction_id}</p>
                        </div>

                        {detail.booking && (
                            <Section icon={Receipt} title="Booking">
                                <Field label="Listing" value={detail.booking.listing_title} />
                                <Field label="Reference" value={detail.booking.booking_reference} />
                                <Field label="Type / Status" value={`${bookingTypeLabel(detail.booking.booking_type)} · ${detail.booking.status}`} />
                                <div className="col-span-2 mt-1 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                                    <Field label="Original" value={money(detail.booking.original_amount)} />
                                    <Field label="Discount" value={money(detail.booking.discount_amount)} />
                                    <Field label="Platform Fee" value={money(detail.booking.platform_fee)} />
                                    <Field label="Total" value={money(detail.booking.total_amount)} strong />
                                </div>
                            </Section>
                        )}

                        <Section icon={User} title="Customer">
                            <Field label="Name" value={detail.customer?.name} />
                            <Field label="Email" value={detail.customer?.email} />
                            <Field label="Partner" value={detail.partner?.name} />
                        </Section>

                        <Section icon={CreditCard} title="Payment">
                            {detail.source === 'manual' ? (
                                <>
                                    <Field label="Mode" value={paymentModeLabel(detail.payment_mode)} />
                                    <Field label="Reference" value={detail.external_reference} />
                                    <Field label="Registered by" value={detail.registered_by?.email} />
                                </>
                            ) : (
                                <>
                                    <Field label="Method" value={pd?.payment_method} />
                                    {pd?.card_last4 && <Field label="Card" value={`${pd.card_network ?? ''} ····${pd.card_last4}`} />}
                                    {pd?.upi_vpa_masked && <Field label="UPI" value={pd.upi_vpa_masked} />}
                                    {pd?.bank_name && <Field label="Bank" value={pd.bank_name} />}
                                    {pd?.wallet_name && <Field label="Wallet" value={pd.wallet_name} />}
                                    <Field label="Razorpay Payment" value={detail.razorpay_payment_id} />
                                    <Field label="Razorpay Order" value={detail.razorpay_order_id} />
                                </>
                            )}
                        </Section>

                        {detail.notes && (
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-sm text-gray-700">{detail.notes}</p>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-400">Recorded {formatDateTime(detail.created_at)}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Register modal
// ---------------------------------------------------------------------------

function RegisterModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
    const [bookingId, setBookingId] = useState('');
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('cash');
    const [ref, setRef] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const valid = bookingId.trim() && amount.trim() && Number(amount) > 0 && mode;

    const submit = async () => {
        if (!valid) return;
        setSubmitting(true);
        setErr(null);
        try {
            await registerPayment({ booking_id: bookingId.trim(), amount: amount.trim(), payment_mode: mode, external_reference: ref.trim() || undefined, notes: notes.trim() || undefined });
            onRegistered();
        } catch (e) {
            const text = e instanceof ApiError
                ? e.code === 'BOOKING_NOT_FOUND' ? 'No booking found with that ID.'
                : e.code === 'INVALID_BOOKING_STATUS' ? 'This booking is not awaiting payment, so it can\'t be settled manually.'
                : e.code === 'AMOUNT_MISMATCH' ? 'The amount must exactly equal the booking total.'
                : e.message
                : 'Could not register the payment.';
            setErr(text);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !submitting && onClose()} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Register Manual Payment</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Confirms the booking, generates the invoice, and emails the customer.</p>
                    </div>
                    <button onClick={onClose} disabled={submitting} className="p-2 hover:bg-gray-50 rounded-full"><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {err && <div role="alert" className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-red-700"><AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{err}</span></div>}
                    <Labeled label="Booking ID" required>
                        <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="UUID of the booking to settle" className={inputCls} />
                    </Labeled>
                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                        <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" /> The amount must exactly equal the booking total — partial payments are rejected.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Labeled label="Amount (₹)" required>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500.00" className={inputCls} />
                        </Labeled>
                        <Labeled label="Payment mode" required>
                            <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
                                {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </Labeled>
                    </div>
                    <Labeled label="External reference">
                        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UTR / cheque number" className={inputCls} />
                    </Labeled>
                    <Labeled label="Notes">
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Paid in cash at the desk" className={cn(inputCls, 'resize-none')} />
                    </Labeled>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={submitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                    <button onClick={submit} disabled={!valid || submitting} className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} {submitting ? 'Registering…' : 'Register Payment'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400';

function ToastBar({ toast, onClose }: { toast: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div role={toast.type === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2 text-sm rounded-xl px-4 py-3 border', toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700')}>
            {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{toast.text}</span>
            <button onClick={onClose} className="text-current/60 hover:text-current"><X size={16} /></button>
        </div>
    );
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Icon size={12} /> {title}</h3>
            <div className="grid grid-cols-2 gap-3">{children}</div>
        </div>
    );
}

function Field({ label, value, strong }: { label: string; value?: string | null; strong?: boolean }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={cn('break-words mt-0.5', strong ? 'text-base font-bold text-gray-900' : 'text-sm text-gray-800')}>{value || '—'}</p>
        </div>
    );
}

function Labeled({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
            {children}
        </div>
    );
}

export default PaymentsFinance;
