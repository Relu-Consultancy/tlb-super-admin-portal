import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X, Receipt, Star, Heart, ShieldAlert, Loader2,
    Ban, CircleCheck, LogOut, KeyRound, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { useAuth } from '../../../shared/auth/AuthContext';
import {
    getUser,
    getUserBookings,
    getUserReviews,
    getUserWishlist,
    getUserLoginHistory,
    getUserSecurityLog,
    disableUser,
    enableUser,
    forceLogoutUser,
    resetUserOtp,
    formatMoney,
    humanizeKey,
    userDisplayName,
    ApiError,
    type AdminUserListItem,
    type AdminUserDetail,
    type UserBooking,
    type UserReview,
    type UserWishlistItem,
    type UserLoginEvent,
    type UserSecurityLogEntry,
} from '../../../shared/lib/api';

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

interface UserHistorySlideOutProps {
    user: AdminUserListItem | null;
    onClose: () => void;
    /** Called after a security action changes the user, so the grid can reload. */
    onChanged?: () => void;
}

type Toast = { type: 'success' | 'error'; text: string } | null;

const TABS = [
    { id: 'account', label: 'Account & Security', icon: ShieldAlert },
    { id: 'bookings', label: 'Bookings', icon: Receipt },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

const UserHistorySlideOut = ({ user, onClose, onChanged }: UserHistorySlideOutProps) => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_CUSTOMERS');

    const [activeTab, setActiveTab] = useState('account');

    const [detail, setDetail] = useState<AdminUserDetail | null>(null);
    const [logins, setLogins] = useState<UserLoginEvent[]>([]);
    const [securityLog, setSecurityLog] = useState<UserSecurityLogEntry[]>([]);
    const [bookings, setBookings] = useState<UserBooking[] | null>(null);
    const [reviews, setReviews] = useState<UserReview[] | null>(null);
    const [wishlist, setWishlist] = useState<UserWishlistItem[] | null>(null);
    const [tabLoading, setTabLoading] = useState(false);

    const [actionBusy, setActionBusy] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast>(null);
    const [disableOpen, setDisableOpen] = useState(false);
    const [disableReason, setDisableReason] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    // Reset + load account data whenever a new user is opened.
    useEffect(() => {
        if (!user) return;
        setActiveTab('account');
        setDetail(null);
        setLogins([]);
        setSecurityLog([]);
        setBookings(null);
        setReviews(null);
        setWishlist(null);
        setToast(null);
        getUser(user.id).then(setDetail).catch(() => {});
        getUserLoginHistory(user.id).then(setLogins).catch(() => {});
        getUserSecurityLog(user.id).then(setSecurityLog).catch(() => {});
    }, [user]);

    // Reload account-side data after a security action, and notify the parent.
    const refreshSecurity = async (id: string) => {
        const [d, lh, sl] = await Promise.all([
            getUser(id).catch(() => null),
            getUserLoginHistory(id).catch(() => []),
            getUserSecurityLog(id).catch(() => []),
        ]);
        if (d) setDetail(d);
        setLogins(lh as UserLoginEvent[]);
        setSecurityLog(sl as UserSecurityLogEntry[]);
        onChanged?.();
    };

    const runAction = async (key: string, fn: () => Promise<{ detail?: string }>, fallback: string) => {
        if (!user) return;
        setActionBusy(key);
        setToast(null);
        try {
            const res = await fn();
            flash('success', res.detail || fallback);
            await refreshSecurity(user.id);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Action failed.');
        } finally {
            setActionBusy(null);
        }
    };

    const submitDisable = async () => {
        if (!user || !disableReason.trim()) return;
        setDisableSubmitting(true);
        try {
            const res = await disableUser(user.id, disableReason.trim());
            flash('success', res.detail || 'Account disabled.');
            setDisableOpen(false);
            setDisableReason('');
            await refreshSecurity(user.id);
        } catch (err) {
            const msg = err instanceof ApiError
                ? err.code === 'ALREADY_DISABLED' ? 'This account is already disabled.' : err.message
                : 'Could not disable account.';
            flash('error', msg);
        } finally {
            setDisableSubmitting(false);
        }
    };

    // Prefer freshly-fetched detail for the live account status.
    const isActive = detail?.is_active ?? user?.is_active ?? false;

    // Lazy-load each drill-down tab the first time it's opened.
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        const load = async () => {
            if (activeTab === 'bookings' && bookings === null) {
                setTabLoading(true);
                try { const d = await getUserBookings(user.id); if (!cancelled) setBookings(d); } catch { if (!cancelled) setBookings([]); }
                finally { if (!cancelled) setTabLoading(false); }
            } else if (activeTab === 'reviews' && reviews === null) {
                setTabLoading(true);
                try { const d = await getUserReviews(user.id); if (!cancelled) setReviews(d); } catch { if (!cancelled) setReviews([]); }
                finally { if (!cancelled) setTabLoading(false); }
            } else if (activeTab === 'wishlist' && wishlist === null) {
                setTabLoading(true);
                try { const d = await getUserWishlist(user.id); if (!cancelled) setWishlist(d); } catch { if (!cancelled) setWishlist([]); }
                finally { if (!cancelled) setTabLoading(false); }
            }
        };
        load();
        return () => { cancelled = true; };
    }, [activeTab, user, bookings, reviews, wishlist]);

    return (
        <AnimatePresence>
            {user && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200"
                    >
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-gray-900 truncate">Activity Ledger: {userDisplayName(user)}</h2>
                                <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest truncate">{user.email}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors shrink-0">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white px-6 border-b border-gray-200 flex gap-6 overflow-x-auto">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 py-4 text-sm font-bold transition-colors relative whitespace-nowrap",
                                        activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="slideout-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Account & Security */}
                            {activeTab === 'account' && (
                                <div className="space-y-5">
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

                                    <div className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Name', value: userDisplayName(user) },
                                            { label: 'Email', value: user.email },
                                            { label: 'Phone', value: detail?.phone || '—' },
                                            { label: 'User ID', value: user.id },
                                            { label: 'Role', value: detail?.role || 'customer' },
                                            { label: 'Auth Provider', value: user.auth_provider },
                                            { label: 'Verified', value: user.is_verified ? 'Yes' : 'No' },
                                            { label: 'Profile Complete', value: user.is_profile_complete ? 'Yes' : 'No' },
                                            { label: 'Account Status', value: isActive ? 'Active' : 'Disabled' },
                                            { label: 'Disabled Reason', value: detail?.disabled_reason || '—' },
                                            { label: 'Last Login', value: formatDateTime(user.last_login) },
                                            { label: 'Created', value: formatDateTime(user.created_at) },
                                        ].map((row) => (
                                            <div key={row.label} className="flex flex-col gap-0.5 pb-3 border-b border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                                                <span className="text-sm text-gray-800 break-all">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Security actions */}
                                    {canManage && (
                                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Security Actions</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {isActive ? (
                                                    <button onClick={() => { setToast(null); setDisableReason(''); setDisableOpen(true); }} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"><Ban size={14} /> Disable</button>
                                                ) : (
                                                    <button onClick={() => runAction('enable', () => enableUser(user.id), 'Account re-enabled.')} disabled={actionBusy === 'enable'} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60">{actionBusy === 'enable' ? <Loader2 size={14} className="animate-spin" /> : <CircleCheck size={14} />} Enable</button>
                                                )}
                                                <button onClick={() => runAction('logout', () => forceLogoutUser(user.id), 'User force-logged out.')} disabled={actionBusy === 'logout' || !isActive} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all disabled:opacity-50">{actionBusy === 'logout' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Force Logout</button>
                                                <button onClick={() => runAction('otp', () => resetUserOtp(user.id), 'OTP sent to the customer.')} disabled={actionBusy === 'otp' || !isActive} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50">{actionBusy === 'otp' ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Send OTP</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Logins</h3>
                                        {logins.length ? (
                                            <div className="space-y-2">
                                                {logins.map((e) => (
                                                    <div key={e.id} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2 last:border-0">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-800 truncate">{e.ip_address || '—'} · <span className="font-normal text-gray-500">{e.auth_provider}</span></p>
                                                            <p className="text-[10px] text-gray-400 truncate">{e.device_info || '—'}</p>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatDateTime(e.created_at)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-xs text-gray-400">No login history.</p>}
                                    </div>

                                    {/* Admin security log */}
                                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><ShieldAlert size={13} /> Admin Security Log</h3>
                                        {securityLog.length ? (
                                            <div className="space-y-2">
                                                {securityLog.map((s) => (
                                                    <div key={s.id} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-gray-800 capitalize">{humanizeKey(s.action)}</span>
                                                            <span className="text-[10px] text-gray-400">{formatDateTime(s.created_at)}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">by {s.admin_email || 'system'}{s.ip_address ? ` · ${s.ip_address}` : ''}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-xs text-gray-400">No admin actions recorded.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Bookings */}
                            {activeTab === 'bookings' && (
                                tabLoading ? <TabLoader /> : bookings && bookings.length ? (
                                    <div className="space-y-3">
                                        {bookings.map((b) => (
                                            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 truncate">{b.listing?.title || b.booking_type || 'Booking'}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{b.booking_reference}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 shrink-0">{formatMoney(b.total_amount, b.currency)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <Badge text={b.status} tone="gray" />
                                                    <Badge text={b.payment_status} tone={b.payment_status === 'paid' ? 'green' : 'amber'} />
                                                    <span className="text-[10px] text-gray-400 ml-auto">{formatDateTime(b.created_at)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <Empty icon={Receipt} label="No bookings yet" />
                            )}

                            {/* Reviews */}
                            {activeTab === 'reviews' && (
                                tabLoading ? <TabLoader /> : reviews && reviews.length ? (
                                    <div className="space-y-3">
                                        {reviews.map((r) => (
                                            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-gray-900 truncate">{r.listing?.title || 'Listing'}</p>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} size={13} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-800'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                {r.comment && <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>}
                                                <p className="text-[10px] text-gray-400 mt-2">{formatDateTime(r.created_at)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <Empty icon={Star} label="No reviews yet" />
                            )}

                            {/* Wishlist */}
                            {activeTab === 'wishlist' && (
                                tabLoading ? <TabLoader /> : wishlist && wishlist.length ? (
                                    <div className="space-y-2">
                                        {wishlist.map((w) => (
                                            <div key={w.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{w.listing?.title || 'Listing'}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{w.listing?.listing_type || '—'}</p>
                                                </div>
                                                <Badge text={w.is_active ? 'Saved' : 'Removed'} tone={w.is_active ? 'green' : 'gray'} />
                                            </div>
                                        ))}
                                    </div>
                                ) : <Empty icon={Heart} label="Wishlist is empty" />
                            )}
                        </div>
                    </motion.div>

                    {/* Disable reason modal */}
                    {disableOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !disableSubmitting && setDisableOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900">Disable Customer</h2>
                                    <button onClick={() => setDisableOpen(false)} disabled={disableSubmitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-gray-500">Disabling <span className="font-bold text-gray-900">{user.email}</span> immediately revokes their access. Provide a reason for the audit log.</p>
                                    <textarea value={disableReason} onChange={(e) => setDisableReason(e.target.value)} placeholder="e.g. Policy violation — repeated spam reports" disabled={disableSubmitting} className="w-full h-28 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60" />
                                </div>
                                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                    <button onClick={() => setDisableOpen(false)} disabled={disableSubmitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                                    <button onClick={submitDisable} disabled={disableSubmitting || !disableReason.trim()} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-gray-900 font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                        {disableSubmitting && <Loader2 size={16} className="animate-spin" />}
                                        {disableSubmitting ? 'Disabling…' : 'Disable Account'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

function TabLoader() {
    return <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>;
}

function Empty({ icon, label }: { icon: typeof Receipt; label: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200">
            <EmptyState icon={icon} title={label} />
        </div>
    );
}

function Badge({ text, tone }: { text: string; tone: 'gray' | 'green' | 'amber' }) {
    const tones = {
        gray: 'bg-gray-100 text-gray-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-700',
    };
    return <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', tones[tone])}>{text || '—'}</span>;
}

export default UserHistorySlideOut;
