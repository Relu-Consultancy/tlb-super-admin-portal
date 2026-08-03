import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    History,
    Users,
    Ban,
    CircleCheck,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../../shared/components/ui/Card';
import EmptyState from '../../../shared/components/ui/EmptyState';
import Select from '../../../shared/components/ui/Select';
import { cn } from '../../../shared/lib/utils';
import { useAuth } from '../../../shared/auth/AuthContext';
import { listUsers, disableUser, enableUser, userDisplayName, ApiError, type AdminUserListItem } from '../../../shared/lib/api';

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

type Toast = { type: 'success' | 'error'; text: string } | null;

interface UserDirectoryGridProps {
    onOpenHistory: (user: AdminUserListItem) => void;
    /** Bump to force a reload (e.g. after a security action in the slide-out). */
    refreshSignal?: number;
}

const UserDirectoryGrid = ({ onOpenHistory, refreshSignal }: UserDirectoryGridProps) => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_CUSTOMERS');

    const [customers, setCustomers] = useState<AdminUserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'disabled'>('');

    const [busyId, setBusyId] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast>(null);
    const [disableTarget, setDisableTarget] = useState<AdminUserListItem | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    const loadCustomers = useCallback(
        async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await listUsers({
                    search: debouncedSearch || undefined,
                    is_active: statusFilter === '' ? undefined : statusFilter === 'active',
                });
                setCustomers(res);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Failed to load users.');
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearch, statusFilter],
    );

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    // Reload when the parent signals a change (e.g. a security action).
    useEffect(() => {
        if (refreshSignal) loadCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshSignal]);

    const submitDisable = async () => {
        if (!disableTarget || !disableReason.trim()) return;
        setDisableSubmitting(true);
        try {
            const res = await disableUser(disableTarget.id, disableReason.trim());
            flash('success', res.detail || 'Customer account has been disabled.');
            setDisableTarget(null);
            setDisableReason('');
            loadCustomers();
        } catch (err) {
            const msg = err instanceof ApiError
                ? err.code === 'USER_NOT_FOUND' ? 'Customer not found.'
                : err.code === 'ALREADY_DISABLED' ? 'This account is already disabled.'
                : err.message
                : 'Could not disable customer.';
            flash('error', msg);
        } finally {
            setDisableSubmitting(false);
        }
    };

    const handleEnable = async (c: AdminUserListItem) => {
        setBusyId(c.id);
        setToast(null);
        try {
            const res = await enableUser(c.id);
            flash('success', res.detail || 'Customer account has been re-enabled.');
            loadCustomers();
        } catch (err) {
            const msg = err instanceof ApiError
                ? err.code === 'ALREADY_ENABLED' ? 'This account is already active.' : err.message
                : 'Could not enable customer.';
            flash('error', msg);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">ZONE 2: Master User Directory &amp; Interactive Drill-Down</h2>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
                <div className="relative flex-1 min-w-[250px]">
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <Select
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as '' | 'active' | 'disabled')}
                    placeholder="All Account Status"
                    options={[
                        { value: '', label: 'All Account Status' },
                        { value: 'active', label: 'Active' },
                        { value: 'disabled', label: 'Disabled' },
                    ]}
                />
            </div>

            {toast && (
                <div
                    role={toast.type === 'error' ? 'alert' : 'status'}
                    className={cn(
                        'flex items-start gap-2 text-sm rounded-xl px-4 py-3 border',
                        toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700',
                    )}
                >
                    {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="text-current/60 hover:text-current"><X size={16} /></button>
                </div>
            )}

            {/* User Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider &amp; Verified</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={5}><EmptyState icon={AlertCircle} title="Couldn't load users" description={error} /></td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={5}><EmptyState icon={Users} title="No users found" description="No customers match the current filters." /></td></tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-yellow-50/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={`https://picsum.photos/seed/${c.email}/100/100`} className="w-10 h-10 rounded-xl object-cover border border-gray-200" alt="" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{userDisplayName(c)}</p>
                                                    <p className="text-xs text-gray-500">{c.email}</p>
                                                    <p className="text-[10px] text-gray-400">Joined {formatDateTime(c.created_at)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="w-fit px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{c.auth_provider || '—'}</span>
                                                <span className={cn('w-fit px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', c.is_verified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400')}>
                                                    {c.is_verified ? 'Verified' : 'Unverified'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-500">{formatDateTime(c.last_login)}</td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={cn('px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', c.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}
                                            >
                                                {c.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onOpenHistory(c)}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-yellow-400 hover:text-gray-900 transition-all"
                                                >
                                                    <History size={14} /> View History
                                                </button>
                                                {canManage && (
                                                    c.is_active ? (
                                                        <button onClick={() => { setToast(null); setDisableReason(''); setDisableTarget(c); }} title="Disable account" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                            <Ban size={16} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleEnable(c)} disabled={busyId === c.id} title="Enable account" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-60">
                                                            {busyId === c.id ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />}
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
                {!loading && !error && customers.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">{customers.length} users</div>
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
        </section>
    );
};

export default UserDirectoryGrid;
