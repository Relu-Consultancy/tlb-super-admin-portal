import { useState, useEffect, useCallback, type ReactNode } from 'react';
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
    Download,
    LogOut,
    KeyRound,
    ShieldAlert,
    History,
    Mail,
    Phone,
    BadgeCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listUsers,
    getUser,
    getUserMetrics,
    getUserLoginHistory,
    getUserSecurityLog,
    disableUser,
    enableUser,
    forceLogoutUser,
    resetUserOtp,
    queueUserExport,
    getUserExportJob,
    downloadUserExport,
    userDisplayName,
    pickStat,
    formatMoney,
    humanizeKey,
    ApiError,
    type AdminUserListItem,
    type AdminUserDetail,
    type UserMetrics,
    type UserLoginEvent,
    type UserSecurityLogEntry,
    type ListUsersParams,
} from '../../shared/lib/api';

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Total bookings from the free-form booking_stats blob. */
function bookingCount(stats: Record<string, unknown> | null): string {
    const v = pickStat(stats, 'total_bookings', 'bookings_count', 'bookings', 'total');
    return v === undefined ? '—' : String(v);
}
function bookingSpend(stats: Record<string, unknown> | null): string | null {
    const v = pickStat(stats, 'total_spend', 'total_spent', 'lifetime_spend', 'total_amount');
    return v === undefined ? null : formatMoney(v as string | number);
}

type Toast = { type: 'success' | 'error'; text: string } | null;

const UserManagement = () => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_CUSTOMERS');

    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<UserMetrics | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
    const [providerFilter, setProviderFilter] = useState('');
    const [ordering, setOrdering] = useState('-created_at');

    const [busyId, setBusyId] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast>(null);
    const [exporting, setExporting] = useState(false);

    // Disable reason modal
    const [disableTarget, setDisableTarget] = useState<AdminUserListItem | AdminUserDetail | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);

    // Detail slide-over
    const [detailId, setDetailId] = useState<string | null>(null);
    const [detail, setDetail] = useState<AdminUserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [loginHistory, setLoginHistory] = useState<UserLoginEvent[]>([]);
    const [securityLog, setSecurityLog] = useState<UserSecurityLogEntry[]>([]);
    const [actionBusy, setActionBusy] = useState<string | null>(null);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    const buildParams = useCallback(
        (): ListUsersParams => ({
            search: debouncedSearch || undefined,
            is_active: statusFilter === '' ? undefined : statusFilter === 'true',
            auth_provider: providerFilter || undefined,
            ordering,
        }),
        [debouncedSearch, statusFilter, providerFilter, ordering],
    );

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setUsers(await listUsers(buildParams()));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const loadMetrics = useCallback(async () => {
        try {
            setMetrics(await getUserMetrics());
        } catch {
            /* non-critical */
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadMetrics(); }, [loadMetrics]);

    // --- Detail ---
    const openDetail = useCallback(async (id: string) => {
        setDetailId(id);
        setDetail(null);
        setLoginHistory([]);
        setSecurityLog([]);
        setDetailLoading(true);
        try {
            const [d, lh, sl] = await Promise.all([
                getUser(id),
                getUserLoginHistory(id).catch(() => []),
                getUserSecurityLog(id).catch(() => []),
            ]);
            setDetail(d);
            setLoginHistory(lh as UserLoginEvent[]);
            setSecurityLog(sl as UserSecurityLogEntry[]);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load user.');
            setDetailId(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const closeDetail = () => {
        setDetailId(null);
        setDetail(null);
    };

    const refreshAfter = async (id: string) => {
        loadUsers();
        loadMetrics();
        if (detailId === id) await openDetail(id);
    };

    const submitDisable = async () => {
        if (!disableTarget || !disableReason.trim()) return;
        setDisableSubmitting(true);
        try {
            const res = await disableUser(disableTarget.id, disableReason.trim());
            flash('success', res.detail || 'Account disabled.');
            const id = disableTarget.id;
            setDisableTarget(null);
            setDisableReason('');
            await refreshAfter(id);
        } catch (err) {
            const msg = err instanceof ApiError
                ? err.code === 'USER_NOT_FOUND' ? 'User not found.'
                : err.code === 'ALREADY_DISABLED' ? 'This account is already disabled.'
                : err.message
                : 'Could not disable user.';
            flash('error', msg);
        } finally {
            setDisableSubmitting(false);
        }
    };

    const runRowAction = async (
        key: string,
        fn: () => Promise<{ detail?: string }>,
        fallback: string,
        id: string,
    ) => {
        setBusyId(key);
        setActionBusy(key);
        setToast(null);
        try {
            const res = await fn();
            flash('success', res.detail || fallback);
            await refreshAfter(id);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Action failed.');
        } finally {
            setBusyId(null);
            setActionBusy(null);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setToast(null);
        try {
            let job = await queueUserExport(buildParams());
            const done = (s: string) => ['done', 'completed', 'success', 'ready'].includes(s);
            const failed = (s: string) => ['failed', 'error', 'failure'].includes(s);
            for (let i = 0; i < 40 && !done(job.status) && !failed(job.status); i++) {
                await delay(1500);
                job = await getUserExportJob(job.job_id);
            }
            if (failed(job.status)) { flash('error', job.error ? `Export failed: ${job.error}` : 'Export job failed on the server.'); return; }
            if (!done(job.status)) { flash('error', 'Export is taking longer than expected — try again shortly.'); return; }
            const blob = await downloadUserExport(job.job_id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users-export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            flash('success', 'User CSV downloaded.');
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not export users.');
        } finally {
            setExporting(false);
        }
    };

    const metricTiles = metrics ? [
        { label: 'Total Users', value: metrics.total_users, tone: 'text-gray-900' },
        { label: 'Active', value: metrics.active_users, tone: 'text-green-600' },
        { label: 'Inactive', value: metrics.inactive_users, tone: 'text-red-600' },
        { label: 'New This Month', value: metrics.new_this_month, tone: 'text-blue-600' },
    ] : [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 text-sm">Customer accounts, activity and security</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60"
                >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {exporting ? 'Exporting…' : 'Export CSV'}
                </button>
            </header>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metricTiles.map((m) => (
                    <Card key={m.label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.label}</p>
                        <p className={cn('text-3xl font-bold mt-1', m.tone)}>{m.value}</p>
                    </Card>
                ))}
                {!metrics && <Card className="col-span-2 lg:col-span-4 text-center text-gray-400 text-sm py-6">Loading metrics…</Card>}
            </div>
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniMetric label="New Today" value={metrics.new_today} />
                    <MiniMetric label="New This Week" value={metrics.new_this_week} />
                    <MiniMetric label="OTP Users" value={metrics.by_auth_provider?.otp ?? 0} />
                    <MiniMetric label="Google Users" value={metrics.by_auth_provider?.google ?? 0} />
                </div>
            )}

            {toast && (
                <div
                    role={toast.type === 'error' ? 'alert' : 'status'}
                    className={cn('flex items-start gap-2 text-sm rounded-xl px-4 py-3 border', toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700')}
                >
                    {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="text-current/60 hover:text-current"><X size={16} /></button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <input
                        type="text"
                        placeholder="Search by email or name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | 'true' | 'false')} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
                    <option value="">All status</option>
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                </select>
                <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
                    <option value="">Any provider</option>
                    <option value="otp">OTP</option>
                    <option value="google">Google</option>
                </select>
                <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
                    <option value="-created_at">Newest first</option>
                    <option value="created_at">Oldest first</option>
                    <option value="-last_login">Recently active</option>
                    <option value="-total_bookings">Most bookings</option>
                    <option value="email">Email A–Z</option>
                </select>
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bookings</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={6}><EmptyState icon={AlertCircle} title="Couldn't load users" description={error} /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6}><EmptyState icon={Users} title="No users found" description="No customers match the current filters." /></td></tr>
                            ) : (
                                users.map((u) => {
                                    const spend = bookingSpend(u.booking_stats);
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openDetail(u.id)}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{userDisplayName(u)}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="w-fit px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{u.auth_provider || '—'}</span>
                                                    {u.is_verified && <span className="w-fit inline-flex items-center gap-1 text-green-600 text-[10px] font-bold"><BadgeCheck size={12} /> Verified</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{bookingCount(u.booking_stats)}</p>
                                                {spend && <p className="text-[10px] text-gray-400">{spend}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(u.last_login)}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', u.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                                                    {u.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => openDetail(u.id)} title="View details" className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={16} /></button>
                                                    {canManage && (
                                                        u.is_active ? (
                                                            <button onClick={() => { setToast(null); setDisableReason(''); setDisableTarget(u); }} title="Disable account" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Ban size={16} /></button>
                                                        ) : (
                                                            <button onClick={() => runRowAction(u.id, () => enableUser(u.id), 'Account re-enabled.', u.id)} disabled={busyId === u.id} title="Enable account" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-60">
                                                                {busyId === u.id ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />}
                                                            </button>
                                                        )
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

            {/* Disable reason modal */}
            <AnimatePresence>
                {disableTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !disableSubmitting && setDisableTarget(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Disable Customer</h2>
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-500">Disabling <span className="font-bold text-gray-900">{disableTarget.email}</span> immediately revokes their access. Provide a reason for the audit log.</p>
                                <textarea value={disableReason} onChange={(e) => setDisableReason(e.target.value)} placeholder="e.g. Policy violation — repeated spam reports" disabled={disableSubmitting} className="w-full h-28 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60" />
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                                <button onClick={submitDisable} disabled={disableSubmitting || !disableReason.trim()} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                    {disableSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {disableSubmitting ? 'Disabling…' : 'Disable Account'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Detail slide-over */}
            <AnimatePresence>
                {detailId && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDetail} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 truncate">{detail ? userDisplayName(detail) : 'Customer'}</h2>
                                <button onClick={closeDetail} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {detailLoading && !detail ? (
                                    <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
                                ) : detail ? (
                                    <>
                                        {/* Account */}
                                        <SlideSection title="Account">
                                            <div className="grid grid-cols-2 gap-3">
                                                <KV label="Email" value={detail.email} icon={Mail} />
                                                <KV label="Phone" value={detail.phone || '—'} icon={Phone} />
                                                <KV label="Provider" value={detail.auth_provider} />
                                                <KV label="Verified" value={detail.is_verified ? 'Yes' : 'No'} />
                                                <KV label="Status" value={detail.is_active ? 'Active' : 'Disabled'} />
                                                <KV label="Role" value={detail.role || 'customer'} />
                                                <KV label="Last Login" value={formatDateTime(detail.last_login)} />
                                                <KV label="Created" value={formatDateTime(detail.created_at)} />
                                                {detail.forced_logout_at && <KV label="Forced Logout" value={formatDateTime(detail.forced_logout_at)} />}
                                                {detail.disabled_at && <KV label="Disabled At" value={formatDateTime(detail.disabled_at)} />}
                                                {detail.disabled_reason && <KV label="Disabled Reason" value={detail.disabled_reason} />}
                                            </div>
                                        </SlideSection>

                                        {/* Customer profile */}
                                        {detail.customer_profile && Object.keys(detail.customer_profile).length > 0 && (
                                            <SlideSection title="Customer Profile">
                                                <RecordGrid record={detail.customer_profile} />
                                            </SlideSection>
                                        )}

                                        {/* Booking summary */}
                                        {detail.booking_summary && Object.keys(detail.booking_summary).length > 0 && (
                                            <SlideSection title="Booking Summary">
                                                <RecordGrid record={detail.booking_summary} />
                                            </SlideSection>
                                        )}

                                        {/* Security actions */}
                                        {canManage && (
                                            <SlideSection title="Security Actions">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {detail.is_active ? (
                                                        <button onClick={() => { setDisableReason(''); setDisableTarget(detail); }} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"><Ban size={14} /> Disable</button>
                                                    ) : (
                                                        <button onClick={() => runRowAction('enable', () => enableUser(detail.id), 'Account re-enabled.', detail.id)} disabled={actionBusy === 'enable'} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60">{actionBusy === 'enable' ? <Loader2 size={14} className="animate-spin" /> : <CircleCheck size={14} />} Enable</button>
                                                    )}
                                                    <button onClick={() => runRowAction('logout', () => forceLogoutUser(detail.id), 'User force-logged out.', detail.id)} disabled={actionBusy === 'logout' || !detail.is_active} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all disabled:opacity-50"><LogOut size={14} /> Force Logout</button>
                                                    <button onClick={() => runRowAction('otp', () => resetUserOtp(detail.id), 'OTP sent to the customer.', detail.id)} disabled={actionBusy === 'otp' || !detail.is_active} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"><KeyRound size={14} /> Send OTP</button>
                                                </div>
                                            </SlideSection>
                                        )}

                                        {/* Login history */}
                                        <SlideSection title="Login History" icon={History}>
                                            {loginHistory.length ? (
                                                <div className="space-y-2">
                                                    {loginHistory.map((e) => (
                                                        <div key={e.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-800 truncate">{e.ip_address || '—'} · <span className="font-normal text-gray-500">{e.auth_provider}</span></p>
                                                                <p className="text-[10px] text-gray-400 truncate">{e.device_info || '—'}</p>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatDateTime(e.created_at)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-xs text-gray-400">No login history.</p>}
                                        </SlideSection>

                                        {/* Security log */}
                                        <SlideSection title="Admin Security Log" icon={ShieldAlert}>
                                            {securityLog.length ? (
                                                <div className="space-y-2">
                                                    {securityLog.map((s) => (
                                                        <div key={s.id} className="text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-gray-800 capitalize">{humanizeKey(s.action)}</span>
                                                                <span className="text-[10px] text-gray-400">{formatDateTime(s.created_at)}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">by {s.admin_email || 'system'}{s.ip_address ? ` · ${s.ip_address}` : ''}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-xs text-gray-400">No admin actions recorded.</p>}
                                        </SlideSection>
                                    </>
                                ) : (
                                    <EmptyState icon={AlertCircle} title="Couldn't load user" />
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- presentational helpers ---

function MiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}

function SlideSection({ title, icon: Icon, children }: { title: string; icon?: typeof Mail; children: ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                {Icon && <Icon size={13} />} {title}
            </h3>
            {children}
        </div>
    );
}

function KV({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">{Icon && <Icon size={11} />}{label}</span>
            <span className="text-sm text-gray-800 break-all">{value}</span>
        </div>
    );
}

function RecordGrid({ record }: { record: Record<string, unknown> }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {Object.entries(record).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{humanizeKey(k)}</span>
                    <span className="text-sm text-gray-800 break-all">{v === null || v === undefined || v === '' ? '—' : String(v)}</span>
                </div>
            ))}
        </div>
    );
}

export default UserManagement;
