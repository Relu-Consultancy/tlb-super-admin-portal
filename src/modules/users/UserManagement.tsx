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
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import Select from '../../shared/components/ui/Select';
import { cn } from '../../shared/lib/utils';
import PeriodFilter from '../../shared/components/ui/PeriodFilter';
import { resolvePeriodRange, type StandardPeriod } from '../../shared/lib/period';
import { useAuth } from '../../shared/auth/AuthContext';
import UserHistorySlideOut from './UserSection/UserHistorySlideOut';
import {
    listUsersPaginated,
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
    const [period, setPeriod] = useState<StandardPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
    const [providerFilter, setProviderFilter] = useState('');
    const [ordering, setOrdering] = useState('-created_at');

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast>(null);
    const [exporting, setExporting] = useState(false);

    // Disable reason modal
    const [disableTarget, setDisableTarget] = useState<AdminUserListItem | AdminUserDetail | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);

    // Detail slide-over
    const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1); // reset page on search
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    // reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [statusFilter, providerFilter, ordering]);

    const buildParams = useCallback(
        (): ListUsersParams => ({
            search: debouncedSearch || undefined,
            is_active: statusFilter === '' ? undefined : statusFilter === 'true',
            auth_provider: providerFilter || undefined,
            ordering,
            page,
        }),
        [debouncedSearch, statusFilter, providerFilter, ordering, page],
    );

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listUsersPaginated(buildParams());
            setUsers(res.results);
            setTotalCount(res.count);
            setHasNextPage(!!res.next);
            setHasPrevPage(!!res.previous);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const loadMetrics = useCallback(async () => {
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        try {
            setMetrics(await getUserMetrics(resolvePeriodRange(period, dateFrom, dateTo)));
        } catch {
            /* non-critical */
        }
    }, [period, dateFrom, dateTo]);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadMetrics(); }, [loadMetrics]);

    // --- Detail ---
    const openDetail = useCallback((id: string) => {
        const u = users.find((x) => x.id === id);
        if (u) setSelectedUser(u);
    }, [users]);

    const closeDetail = () => {
        setSelectedUser(null);
    };

    const refreshAfter = async (id: string) => {
        loadUsers();
        loadMetrics();
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
        setToast(null);
        try {
            const res = await fn();
            flash('success', res.detail || fallback);
            await refreshAfter(id);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Action failed.');
        } finally {
            setBusyId(null);
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
        { label: 'Total Customers', value: metrics.total_users, tone: 'text-gray-900' },
        { label: 'Active Customers (30d)', value: metrics.active_users, tone: 'text-green-600' },
        { label: 'Inactive Customers (30d)', value: metrics.inactive_users, tone: 'text-red-600' },
        { label: 'New Customers', value: metrics.new_this_month, tone: 'text-blue-600' },
    ] : [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 text-sm">Customer accounts, activity and security</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <PeriodFilter
                        value={period}
                        onChange={setPeriod}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                    />
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60"
                    >
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {exporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                </div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MiniMetric label="New Today" value={metrics.new_today} />
                    <MiniMetric label="New This Week" value={metrics.new_this_week} />
                    <MiniMetric label="Enabled Accounts" value={metrics.enabled_users} />
                    <MiniMetric label="Disabled Accounts" value={metrics.disabled_users} />
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
                <Select
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as '' | 'true' | 'false')}
                    placeholder="All status"
                    options={[
                        { value: '', label: 'All status' },
                        { value: 'true', label: 'Active' },
                        { value: 'false', label: 'Disabled' },
                    ]}
                />
                <Select
                    value={providerFilter}
                    onChange={setProviderFilter}
                    placeholder="Any provider"
                    options={[
                        { value: '', label: 'Any provider' },
                        { value: 'otp', label: 'OTP' },
                        { value: 'google', label: 'Google' },
                    ]}
                />
                <Select
                    value={ordering}
                    onChange={setOrdering}
                    options={[
                        { value: '-created_at', label: 'Newest first' },
                        { value: 'created_at', label: 'Oldest first' },
                        { value: '-last_login', label: 'Recently active' },
                        { value: '-total_bookings', label: 'Most bookings' },
                        { value: 'email', label: 'Email A–Z' },
                    ]}
                />
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bookings</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
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
                                                {userDisplayName(u) !== u.email && (
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                )}
                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {u.id}</p>
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
                {!loading && !error && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-900">{users.length}</span> of <span className="font-medium text-gray-900">{totalCount}</span> customers
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={!hasPrevPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2">Page {page}</span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!hasNextPage}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Disable reason modal */}
            <AnimatePresence>
                {disableTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !disableSubmitting && setDisableTarget(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Disable Customer</h2>
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
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
            <UserHistorySlideOut
                user={selectedUser}
                onClose={closeDetail}
                onChanged={loadUsers}
            />
        </div>
    );
};

// --- presentational helpers ---

function MiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}



export default UserManagement;
