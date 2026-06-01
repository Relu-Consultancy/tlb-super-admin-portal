import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Eye,
    Ban,
    CircleCheck,
    Users,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listPartners,
    getPartner,
    disablePartner,
    enablePartner,
    partnerStatusLabel,
    partnerStatusTone,
    ApiError,
    type Partner,
} from '../../shared/lib/api';

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

type Toast = { type: 'success' | 'error'; text: string } | null;

const PartnerManagement = () => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_PARTNERS');

    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'disabled'>('');

    const [busyId, setBusyId] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast>(null);

    const [disableTarget, setDisableTarget] = useState<Partner | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);

    const [detail, setDetail] = useState<Partner | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    const loadPartners = useCallback(
        async (toPage: number) => {
            setLoading(true);
            setError(null);
            try {
                const res = await listPartners({
                    page: toPage,
                    search: debouncedSearch || undefined,
                    is_active: statusFilter === '' ? undefined : statusFilter === 'active',
                });
                setPartners(res.results);
                setCount(res.count);
                setPage(res.page ?? toPage);
                setHasNext(!!res.next);
                setHasPrev(!!res.previous);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Failed to load partners.');
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearch, statusFilter],
    );

    useEffect(() => {
        loadPartners(1);
    }, [loadPartners]);

    const openDetail = async (p: Partner) => {
        setDetail(p);
        setDetailLoading(true);
        try {
            const fresh = await getPartner(p.id);
            setDetail(fresh);
        } catch {
            /* keep row data */
        } finally {
            setDetailLoading(false);
        }
    };

    const submitDisable = async () => {
        if (!disableTarget || !disableReason.trim()) return;
        setDisableSubmitting(true);
        try {
            const res = await disablePartner(disableTarget.id, disableReason.trim());
            flash('success', res.detail || 'Partner account has been disabled.');
            setDisableTarget(null);
            setDisableReason('');
            loadPartners(page);
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.code === 'PARTNER_NOT_FOUND' || err.code === 'USER_NOT_FOUND'
                        ? 'Partner not found.'
                        : err.code === 'ALREADY_DISABLED'
                          ? 'This partner is already disabled.'
                          : err.message
                    : 'Could not disable partner.';
            flash('error', msg);
        } finally {
            setDisableSubmitting(false);
        }
    };

    const handleEnable = async (p: Partner) => {
        setBusyId(p.id);
        setToast(null);
        try {
            const res = await enablePartner(p.id);
            flash('success', res.detail || 'Partner account has been re-enabled.');
            loadPartners(page);
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.code === 'ALREADY_ENABLED'
                        ? 'This partner is already active.'
                        : err.code === 'PARTNER_NOT_FOUND' || err.code === 'USER_NOT_FOUND'
                          ? 'Partner not found.'
                          : err.message
                    : 'Could not enable partner.';
            flash('error', msg);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
                    <p className="text-gray-500 text-sm">Manage partner accounts and their access</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64 bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'disabled')}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer"
                    >
                        <option value="">All status</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
            </header>

            {toast && (
                <div
                    role={toast.type === 'error' ? 'alert' : 'status'}
                    className={cn(
                        'flex items-start gap-2 text-sm rounded-xl px-4 py-3 border',
                        toast.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-green-50 border-green-200 text-green-700',
                    )}
                >
                    {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="text-current/60 hover:text-current"><X size={16} /></button>
                </div>
            )}

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={6}><EmptyState icon={AlertCircle} title="Couldn't load partners" description={error} /></td></tr>
                            ) : partners.length === 0 ? (
                                <tr><td colSpan={6}><EmptyState icon={Users} title="No partners found" description="No partners match the current filters." /></td></tr>
                            ) : (
                                partners.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{p.email}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{p.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{p.auth_provider || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', partnerStatusTone(p.partner_status))}>
                                                {partnerStatusLabel(p.partner_status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                title={!p.is_active && p.disabled_reason ? p.disabled_reason : undefined}
                                                className={cn(
                                                    'px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider',
                                                    p.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
                                                )}
                                            >
                                                {p.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(p.last_login)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openDetail(p)}
                                                    title="View details"
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {canManage && (
                                                    p.is_active ? (
                                                        <button
                                                            onClick={() => { setToast(null); setDisableReason(''); setDisableTarget(p); }}
                                                            title="Disable account"
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEnable(p)}
                                                            disabled={busyId === p.id}
                                                            title="Enable account"
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-60"
                                                        >
                                                            {busyId === p.id ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {(hasPrev || hasNext) && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Page {page} · {count} total</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadPartners(page - 1)}
                                disabled={!hasPrev || loading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                onClick={() => loadPartners(page + 1)}
                                disabled={!hasNext || loading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Disable reason modal */}
            <AnimatePresence>
                {disableTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !disableSubmitting && setDisableTarget(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Disable Partner</h2>
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-500">
                                    Disabling <span className="font-bold text-gray-900">{disableTarget.email}</span> deactivates both their account and all their listings. Provide a reason for the audit log.
                                </p>
                                <textarea
                                    value={disableReason}
                                    onChange={(e) => setDisableReason(e.target.value)}
                                    placeholder="e.g. Fraudulent listings reported"
                                    disabled={disableSubmitting}
                                    className="w-full h-28 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60"
                                />
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                                <button
                                    onClick={submitDisable}
                                    disabled={disableSubmitting || !disableReason.trim()}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {disableSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {disableSubmitting ? 'Disabling…' : 'Disable Partner'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Detail slide-over */}
            <AnimatePresence>
                {detail && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Partner Details</h2>
                                <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {detailLoading && <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={14} className="animate-spin" /> Refreshing…</div>}
                                {[
                                    { label: 'Email', value: detail.email },
                                    { label: 'Partner ID', value: detail.id },
                                    { label: 'Auth Provider', value: detail.auth_provider },
                                    { label: 'Partner Status', value: partnerStatusLabel(detail.partner_status) },
                                    { label: 'Partner Active', value: detail.partner_is_active ? 'Yes' : 'No' },
                                    { label: 'Account Status', value: detail.is_active ? 'Active' : 'Disabled' },
                                    { label: 'Disabled Reason', value: detail.disabled_reason || '—' },
                                    { label: 'Disabled At', value: formatDateTime(detail.disabled_at) },
                                    { label: 'Last Login', value: formatDateTime(detail.last_login) },
                                    { label: 'Created', value: formatDateTime(detail.created_at) },
                                ].map((row) => (
                                    <div key={row.label} className="flex flex-col gap-0.5 pb-3 border-b border-gray-50 last:border-0">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                                        <span className="text-sm text-gray-800 break-all">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                            {canManage && (
                                <div className="p-6 border-t border-gray-100">
                                    {detail.is_active ? (
                                        <button
                                            onClick={() => { const p = detail; setDetail(null); setDisableReason(''); setDisableTarget(p); }}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                                        >
                                            <Ban size={16} /> Disable Partner
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { const p = detail; setDetail(null); handleEnable(p); }}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-all"
                                        >
                                            <CircleCheck size={16} /> Enable Partner
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PartnerManagement;
