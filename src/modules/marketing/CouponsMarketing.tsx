import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CheckCircle,
    XCircle,
    X,
    Ticket,
    Download,
    Power,
    Eye,
    Tag,
    Calendar,
    Users,
    Store,
    Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import Select from '../../shared/components/ui/Select';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listCoupons,
    getCoupon,
    getCouponUsages,
    activateCoupon,
    deactivateCoupon,
    getPlatformCouponAnalytics,
    getPartnerCouponAnalytics,
    getRedemptionReport,
    couponDiscountLabel,
    couponTypeLabel,
    couponTypeTone,
    isCouponExpired,
    parseAmount,
    formatMoney,
    COUPON_TYPES,
    DISCOUNT_TYPES,
    ApiError,
    type CouponListItem,
    type CouponDetail,
    type CouponUsage,
    type CouponAnalytics,
    type ListCouponsParams,
} from '../../shared/lib/api';

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return iso;
    }
}
function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

type Toast = { type: 'success' | 'error'; text: string } | null;

const CouponsMarketing = ({ onCreateCoupon }: { onCreateCoupon?: () => void }) => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_LISTINGS') || hasPermission('MANAGE_ADMINS');

    const [coupons, setCoupons] = useState<CouponListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [platformAnalytics, setPlatformAnalytics] = useState<CouponAnalytics | null>(null);
    const [partnerAnalytics, setPartnerAnalytics] = useState<CouponAnalytics | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [discountFilter, setDiscountFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

    // Detail
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<CouponDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [usages, setUsages] = useState<CouponUsage[]>([]);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState<Toast>(null);
    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    const buildParams = useCallback((): ListCouponsParams => ({
        coupon_type: typeFilter || undefined,
        discount_type: discountFilter || undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
    }), [typeFilter, discountFilter, activeFilter]);

    const loadCoupons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setCoupons(await listCoupons(buildParams()));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load coupons.');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const loadAnalytics = useCallback(async () => {
        const [p, pa] = await Promise.all([
            getPlatformCouponAnalytics().catch(() => null),
            getPartnerCouponAnalytics().catch(() => null),
        ]);
        setPlatformAnalytics(p);
        setPartnerAnalytics(pa);
    }, []);

    useEffect(() => { loadCoupons(); }, [loadCoupons]);
    useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

    // Combined analytics across platform + partner (no "all" endpoint).
    const combined = (() => {
        const a = platformAnalytics, b = partnerAnalytics;
        if (!a && !b) return null;
        const sum = (k: keyof CouponAnalytics) => (Number((a?.[k] as number) || 0) + Number((b?.[k] as number) || 0));
        const discount = (parseAmount(a?.total_discount_saved) ?? 0) + (parseAmount(b?.total_discount_saved) ?? 0);
        return {
            total_coupons: sum('total_coupons'),
            active_coupons: sum('active_coupons'),
            total_redemptions: sum('total_redemptions'),
            redemptions_this_month: sum('redemptions_this_month'),
            total_discount_saved: discount,
        };
    })();

    // Client-side code search over the loaded list.
    const term = search.trim().toLowerCase();
    const visible = term ? coupons.filter((c) => c.code?.toLowerCase().includes(term) || c.partner_email?.toLowerCase().includes(term)) : coupons;

    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            const [d, u] = await Promise.all([getCoupon(id), getCouponUsages(id).catch(() => [])]);
            setDetail(d);
            setUsages(u as CouponUsage[]);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load coupon.');
            setSelectedId(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const openDetail = (c: CouponListItem) => {
        setSelectedId(c.id);
        setDetail(null);
        setUsages([]);
        loadDetail(c.id);
    };

    const toggleActive = async (c: CouponListItem | CouponDetail, fromDetail = false) => {
        setBusyId(c.id);
        setToast(null);
        try {
            if (c.is_active) await deactivateCoupon(c.id);
            else await activateCoupon(c.id);
            flash('success', `Coupon ${c.is_active ? 'deactivated' : 'activated'}.`);
            await loadCoupons();
            loadAnalytics();
            if (fromDetail) await loadDetail(c.id);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not update the coupon.');
        } finally {
            setBusyId(null);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setToast(null);
        try {
            const rows = await getRedemptionReport({ coupon_type: typeFilter || undefined, discount_type: discountFilter || undefined });
            if (rows.length === 0) { flash('error', 'No redemptions to export for the current filters.'); return; }
            const header = ['Coupon', 'Type', 'Discount Type', 'Partner', 'Customer', 'Booking', 'Discount Applied', 'Used At'];
            const csv = [header, ...rows.map((r) => [r.coupon_code, r.coupon_type, r.discount_type, r.partner_email ?? '', r.customer_email, r.booking_reference, parseAmount(r.discount_applied) ?? r.discount_applied, r.used_at])]
                .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
            const a = document.createElement('a');
            a.href = url; a.download = 'coupon-redemptions.csv';
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
            flash('success', `Exported ${rows.length} redemptions.`);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not export the report.');
        } finally {
            setExporting(false);
        }
    };

    const tiles = combined ? [
        { label: 'Total Coupons', value: combined.total_coupons.toLocaleString(), tone: 'text-gray-900' },
        { label: 'Active', value: combined.active_coupons.toLocaleString(), tone: 'text-green-600' },
        { label: 'Redemptions', value: combined.total_redemptions.toLocaleString(), tone: 'text-blue-600' },
        { label: 'Discount Saved', value: formatMoney(combined.total_discount_saved, 'INR'), tone: 'text-gray-900' },
    ] : [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coupons & Marketing</h1>
                    <p className="text-gray-500 text-sm">Manage platform & partner discount coupons</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60">
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
                    </button>
                    {canManage && (
                        <button onClick={() => onCreateCoupon?.()} className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">
                            <Plus size={18} /> Create Coupon
                        </button>
                    )}
                </div>
            </header>

            {/* Analytics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {tiles.map((t) => (
                    <Card key={t.label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.label}</p>
                        <p className={cn('text-2xl font-bold mt-1', t.tone)}>{t.value}</p>
                    </Card>
                ))}
                {!combined && <Card className="col-span-2 lg:col-span-4 text-center text-gray-400 text-sm py-6">Loading analytics…</Card>}
            </div>
            {combined && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                    <MiniMetric icon={Store} label="Platform coupons" value={platformAnalytics?.total_coupons ?? 0} sub={`${platformAnalytics?.active_coupons ?? 0} active`} />
                    <MiniMetric icon={Building2} label="Partner coupons" value={partnerAnalytics?.total_coupons ?? 0} sub={`${partnerAnalytics?.active_coupons ?? 0} active`} />
                </div>
            )}

            {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <input type="text" placeholder="Search by code or partner…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    placeholder="All types"
                    options={[{ value: '', label: 'All types' }, ...COUPON_TYPES.map((t) => ({ value: t, label: couponTypeLabel(t) }))]}
                />
                <Select
                    value={discountFilter}
                    onChange={setDiscountFilter}
                    placeholder="Any discount"
                    options={[{ value: '', label: 'Any discount' }, ...DISCOUNT_TYPES.map((d) => ({ value: d, label: d === 'percent' ? 'Percentage' : 'Fixed' }))]}
                />
                <Select
                    value={activeFilter}
                    onChange={(v) => setActiveFilter(v as '' | 'true' | 'false')}
                    placeholder="Any status"
                    options={[
                        { value: '', label: 'Any status' },
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Inactive' },
                    ]}
                />
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Code</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usage</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={7}><EmptyState icon={AlertCircle} title="Couldn't load coupons" description={error} /></td></tr>
                            ) : visible.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon={Ticket} title="No coupons found" description="No coupons match the current filters." /></td></tr>
                            ) : (
                                visible.map((c) => {
                                    const expired = isCouponExpired(c.expires_at);
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-gray-900 tracking-wider uppercase">{c.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', couponTypeTone(c.coupon_type))}>{couponTypeLabel(c.coupon_type)}</span>
                                                {c.partner_email && <p className="text-[11px] text-gray-400 mt-1">{c.partner_email}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-800">{couponDiscountLabel(c.discount_type, c.discount_value)}</td>
                                            <td className="px-6 py-4 text-xs text-gray-600">{c.usage_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ''}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500">{formatDate(c.expires_at)}</td>
                                            <td className="px-6 py-4">
                                                {expired ? (
                                                    <span className="px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider bg-gray-100 text-gray-400">Expired</span>
                                                ) : c.is_active ? (
                                                    <span className="px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider bg-green-50 text-green-600">Active</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider bg-amber-50 text-amber-600">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => openDetail(c)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg" title="View"><Eye size={16} /></button>
                                                    {canManage && (
                                                        <button
                                                            onClick={() => toggleActive(c)}
                                                            disabled={busyId === c.id}
                                                            className={cn('p-2 rounded-lg transition-colors disabled:opacity-50', c.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50')}
                                                            title={c.is_active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {busyId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Detail slide-over */}
            <AnimatePresence>
                {selectedId && (
                    <CouponDetailPanel
                        loading={detailLoading}
                        detail={detail}
                        usages={usages}
                        canManage={canManage}
                        busy={busyId === detail?.id}
                        onToggle={() => detail && toggleActive(detail, true)}
                        onClose={() => { setSelectedId(null); setDetail(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Detail slide-over
// ---------------------------------------------------------------------------

function CouponDetailPanel({ loading, detail, usages, canManage, busy, onToggle, onClose }: {
    loading: boolean; detail: CouponDetail | null; usages: CouponUsage[]; canManage: boolean; busy: boolean; onToggle: () => void; onClose: () => void;
}) {
    const targetTypes = detail ? asList(detail.target_listing_types) : [];
    const genders = detail ? asList(detail.target_genders) : [];
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }} className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-gray-900">Coupon Detail</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full"><X size={20} className="text-gray-400" /></button>
                </div>

                {loading && !detail ? (
                    <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={26} /></div>
                ) : !detail ? (
                    <div className="p-6"><EmptyState icon={AlertCircle} title="Not found" description="Coupon could not be loaded." /></div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xl font-bold text-gray-900 tracking-wider uppercase">{detail.code}</span>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', couponTypeTone(detail.coupon_type))}>{couponTypeLabel(detail.coupon_type)}</span>
                                {isCouponExpired(detail.expires_at) ? (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-gray-100 text-gray-400">Expired</span>
                                ) : (
                                    <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', detail.is_active ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600')}>{detail.is_active ? 'Active' : 'Inactive'}</span>
                                )}
                            </div>
                            {detail.description && <p className="text-sm text-gray-600 mt-2">{detail.description}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Discount" value={couponDiscountLabel(detail.discount_type, detail.discount_value)} />
                            <Field label="Max Discount" value={detail.max_discount ? `₹${parseAmount(detail.max_discount)?.toLocaleString('en-IN')}` : '—'} />
                            <Field label="Min Order" value={detail.min_order_value ? `₹${parseAmount(detail.min_order_value)?.toLocaleString('en-IN')}` : '—'} />
                            <Field label="Used" value={`${detail.usage_count}${detail.usage_limit != null ? ` / ${detail.usage_limit}` : ''}`} />
                            <Field label="Per-user Limit" value={detail.per_user_limit != null ? String(detail.per_user_limit) : '—'} />
                            <Field label="Partner" value={detail.partner_email || '—'} />
                            <Field label="Starts" value={formatDate(detail.starts_at)} />
                            <Field label="Expires" value={formatDate(detail.expires_at)} />
                            <Field label="Created by" value={detail.created_by_admin_email || '—'} />
                        </div>

                        {/* Targeting */}
                        {(detail.target_listings?.length || detail.target_event_categories?.length || targetTypes.length || genders.length || detail.target_min_age != null || detail.target_max_age != null) ? (
                            <div className="pt-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag size={12} /> Targeting</h3>
                                <div className="space-y-2">
                                    {targetTypes.length > 0 && <Chips label="Listing types" items={targetTypes} />}
                                    {detail.target_listings?.length > 0 && <Chips label="Listings" items={detail.target_listings.map((l) => l.title)} />}
                                    {detail.target_event_categories?.length > 0 && <Chips label="Categories" items={detail.target_event_categories.map((c) => c.name)} />}
                                    {genders.length > 0 && <Chips label="Genders" items={genders} />}
                                    {(detail.target_min_age != null || detail.target_max_age != null) && (
                                        <p className="text-xs text-gray-600">Age: {detail.target_min_age ?? '—'} – {detail.target_max_age ?? '—'}</p>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {canManage && (
                            <button
                                onClick={onToggle}
                                disabled={busy}
                                className={cn('w-full flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl transition-all disabled:opacity-60 text-sm', detail.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100')}
                            >
                                {busy ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />} {detail.is_active ? 'Deactivate' : 'Activate'} Coupon
                            </button>
                        )}

                        {/* Usages */}
                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Users size={12} /> Redemptions ({usages.length})</h3>
                            {usages.length === 0 ? (
                                <p className="text-sm text-gray-400">No redemptions yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {usages.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-200">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{u.customer_email}</p>
                                                <p className="text-[11px] text-gray-400 truncate flex items-center gap-1"><Calendar size={10} /> {formatDateTime(u.used_at)}{u.booking_reference ? ` · ${u.booking_reference}` : ''}</p>
                                            </div>
                                            <span className="text-xs font-bold text-green-600 shrink-0">₹{parseAmount(u.discount_applied)?.toLocaleString('en-IN') ?? u.discount_applied}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

/** Normalize a target field that may be an array or a comma/space string. */
function asList(v: string[] | string | null | undefined): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean).map(String);
    return String(v).split(/[,\s]+/).filter(Boolean);
}

function ToastBar({ toast, onClose }: { toast: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div role={toast.type === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2 text-sm rounded-xl px-4 py-3 border', toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700')}>
            {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{toast.text}</span>
            <button onClick={onClose} className="text-current/60 hover:text-current"><XCircle size={16} /></button>
        </div>
    );
}

function MiniMetric({ icon: Icon, label, value, sub }: { icon: typeof Store; label: string; value: number; sub: string }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-50 text-gray-500"><Icon size={18} /></div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-base font-bold text-gray-900">{value.toLocaleString()} <span className="text-[11px] font-medium text-gray-400">· {sub}</span></p>
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm text-gray-800 break-words mt-0.5">{value || '—'}</p>
        </div>
    );
}

function Chips({ label, items }: { label: string; items: string[] }) {
    return (
        <div>
            <p className="text-[11px] text-gray-500 mb-1">{label}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((it, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md capitalize">{it}</span>)}
            </div>
        </div>
    );
}

export default CouponsMarketing;
