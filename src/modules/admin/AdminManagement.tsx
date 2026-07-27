import { useState, useEffect, useCallback } from 'react';
import {
    UserCog,
    X,
    Lock,
    Unlock,
    LogOut,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Settings as SettingsIcon,
    Ban,
    CircleCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listAdmins,
    getAdmin,
    disableAdmin,
    enableAdmin,
    createAdmin,
    changeAdminRole,
    updateAdminPermissions,
    forceLogoutAdmin,
    unlockAdmin,
    getAuditLogs,
    auditActionLabel,
    auditActionTone,
    roleLabel,
    permissionLabel,
    AUDIT_ACTIONS,
    ASSIGNABLE_ROLES,
    ADMIN_ROLES,
    PERMISSIONS,
    ROLE_DEFAULT_PERMISSIONS,
    ApiError,
    type AdminListItem,
    type AdminDetail,
    type AuditLog,
    type AdminRole,
} from '../../shared/lib/api';

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function passwordIssues(pw: string): string[] {
    const issues: string[] = [];
    if (pw.length < 8) issues.push('8+ characters');
    if (!/[A-Z]/.test(pw)) issues.push('an uppercase letter');
    if (!/[a-z]/.test(pw)) issues.push('a lowercase letter');
    if (!/[0-9]/.test(pw)) issues.push('a digit');
    if (!/[^A-Za-z0-9]/.test(pw)) issues.push('a special character');
    return issues;
}

const ADMIN_ERRORS: Record<string, string> = {
    CANNOT_DISABLE_SELF: 'You cannot disable your own account.',
    CANNOT_DISABLE_SUPER_ADMIN: 'You cannot disable a Super Admin.',
    ALREADY_DISABLED: 'This admin is already disabled.',
    ALREADY_ENABLED: 'This admin is already active.',
    CANNOT_CHANGE_OWN_ROLE: 'You cannot change your own role.',
    CANNOT_CHANGE_SUPER_ADMIN_ROLE: "You cannot change a Super Admin's role.",
    ROLE_UNCHANGED: 'The admin already has this role.',
    INVALID_ROLE: 'That role cannot be assigned.',
    INVALID_PERMISSIONS: 'One or more permissions are invalid.',
    CANNOT_SET_SUPER_ADMIN_PERMISSIONS: 'Super Admin permissions cannot be modified.',
    EMAIL_TAKEN: 'An admin with this email already exists.',
    WEAK_PASSWORD: 'Password does not meet the strength requirements.',
    ADMIN_NOT_FOUND: 'Admin not found.',
    NOT_LOCKED: 'This account is not currently locked.',
};

function adminError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
        if (err.isNetworkError) return 'Unable to reach the server. Please try again.';
        return ADMIN_ERRORS[err.code ?? ''] ?? err.message ?? fallback;
    }
    return fallback;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
    SUPER_ADMIN: 'Full access — created only by server command, cannot be assigned via API.',
    ADMIN: 'Manages customers, partners, listings, bookings, enquiries.',
    FINANCE_MANAGER: 'Transactions, reports, revenue, bookings (read-only).',
    SUPPORT_AGENT: 'Enquiries, customer view, bookings (read-only).',
    OPERATIONS_MANAGER: 'Partners, listings, bookings management.',
};

type Toast = { type: 'success' | 'error'; text: string } | null;

const emptyCreateForm = { email: '', full_name: '', role: 'SUPPORT_AGENT' as AdminRole, password: '', phone: '', department: '' };

const AdminManagement = () => {
    const { admin: currentAdmin, hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_ADMINS');
    const canViewAudit = hasPermission('VIEW_AUDIT_LOGS');

    const [activeTab, setActiveTab] = useState('Admins');
    const [toast, setToast] = useState<Toast>(null);

    // Admins list
    const [admins, setAdmins] = useState<AdminListItem[]>([]);
    const [adminsLoading, setAdminsLoading] = useState(true);
    const [adminsError, setAdminsError] = useState<string | null>(null);
    const [busy, setBusy] = useState<{ id: string; type: 'force' | 'unlock' | 'enable' } | null>(null);
    const [pendingForceId, setPendingForceId] = useState<string | null>(null);

    // Audit logs
    const [audits, setAudits] = useState<AuditLog[]>([]);
    const [auditLoading, setAuditLoading] = useState(true);
    const [auditError, setAuditError] = useState<string | null>(null);
    const [auditPage, setAuditPage] = useState(1);
    const [auditCount, setAuditCount] = useState(0);
    const [auditHasNext, setAuditHasNext] = useState(false);
    const [auditHasPrev, setAuditHasPrev] = useState(false);
    const [actionFilter, setActionFilter] = useState('');

    // Detail slide-over (§5/§6)
    const [detail, setDetail] = useState<AdminDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [roleDraft, setRoleDraft] = useState<AdminRole>('SUPPORT_AGENT');
    const [roleSaving, setRoleSaving] = useState(false);
    const [permsDraft, setPermsDraft] = useState<string[]>([]);
    const [permsSaving, setPermsSaving] = useState(false);

    // Disable reason modal
    const [disableTarget, setDisableTarget] = useState<AdminListItem | AdminDetail | null>(null);
    const [disableReason, setDisableReason] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);

    // Create admin modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [createForm, setCreateForm] = useState(emptyCreateForm);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    const loadAdmins = useCallback(async () => {
        setAdminsLoading(true);
        setAdminsError(null);
        try {
            const res = await listAdmins();
            setAdmins(res.results);
        } catch (err) {
            setAdminsError(err instanceof ApiError ? err.message : 'Failed to load admins.');
        } finally {
            setAdminsLoading(false);
        }
    }, []);

    const loadAudits = useCallback(async (page: number, action: string) => {
        setAuditLoading(true);
        setAuditError(null);
        try {
            const res = await getAuditLogs({ page, action: action || undefined });
            setAudits(res.results);
            setAuditCount(res.count);
            setAuditPage(res.page ?? page);
            setAuditHasNext(!!res.next);
            setAuditHasPrev(!!res.previous);
        } catch (err) {
            setAuditError(err instanceof ApiError ? err.message : 'Failed to load audit logs.');
        } finally {
            setAuditLoading(false);
        }
    }, []);

    useEffect(() => { loadAdmins(); }, [loadAdmins]);
    useEffect(() => { loadAudits(1, actionFilter); }, [loadAudits, actionFilter]);

    const openDetail = async (a: AdminListItem) => {
        setDetailLoading(true);
        try {
            const d = await getAdmin(a.id);
            setDetail(d);
            setRoleDraft(d.role);
            setPermsDraft(d.extra_permissions);
        } catch (err) {
            flash('error', adminError(err, 'Could not load admin details.'));
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshDetail = async (id: string) => {
        try {
            const d = await getAdmin(id);
            setDetail(d);
            setRoleDraft(d.role);
            setPermsDraft(d.extra_permissions);
        } catch {
            /* ignore */
        }
    };

    const handleForceLogout = async (a: AdminListItem) => {
        setBusy({ id: a.id, type: 'force' });
        setToast(null);
        try {
            const res = await forceLogoutAdmin(a.id);
            flash('success', res.detail || `${a.full_name} has been force-logged out.`);
            setPendingForceId(null);
            loadAdmins();
            loadAudits(1, actionFilter);
        } catch (err) {
            flash('error', adminError(err, 'Could not force log out.'));
        } finally {
            setBusy(null);
        }
    };

    const handleUnlock = async (a: AdminListItem) => {
        setBusy({ id: a.id, type: 'unlock' });
        setToast(null);
        try {
            const res = await unlockAdmin(a.id);
            flash('success', res.detail || `${a.full_name} has been unlocked.`);
            loadAdmins();
            loadAudits(1, actionFilter);
        } catch (err) {
            flash('error', adminError(err, 'Could not unlock admin.'));
        } finally {
            setBusy(null);
        }
    };

    const handleEnable = async (a: AdminListItem | AdminDetail) => {
        setBusy({ id: a.id, type: 'enable' });
        setToast(null);
        try {
            const res = await enableAdmin(a.id);
            flash('success', res.detail || `${a.full_name} has been re-enabled.`);
            loadAdmins();
            if (detail?.id === a.id) refreshDetail(a.id);
        } catch (err) {
            flash('error', adminError(err, 'Could not enable admin.'));
        } finally {
            setBusy(null);
        }
    };

    const submitDisable = async () => {
        if (!disableTarget || !disableReason.trim()) return;
        setDisableSubmitting(true);
        try {
            const res = await disableAdmin(disableTarget.id, disableReason.trim());
            flash('success', res.detail || `${disableTarget.full_name} has been disabled.`);
            const id = disableTarget.id;
            setDisableTarget(null);
            setDisableReason('');
            loadAdmins();
            loadAudits(1, actionFilter);
            if (detail?.id === id) refreshDetail(id);
        } catch (err) {
            flash('error', adminError(err, 'Could not disable admin.'));
        } finally {
            setDisableSubmitting(false);
        }
    };

    const saveRole = async () => {
        if (!detail || roleDraft === detail.role) return;
        setRoleSaving(true);
        setToast(null);
        try {
            const updated = await changeAdminRole(detail.id, roleDraft);
            setDetail(updated);
            setRoleDraft(updated.role);
            setPermsDraft(updated.extra_permissions);
            flash('success', `Role updated to ${roleLabel(updated.role)}. The admin must re-login.`);
            loadAdmins();
            loadAudits(1, actionFilter);
        } catch (err) {
            flash('error', adminError(err, 'Could not change role.'));
        } finally {
            setRoleSaving(false);
        }
    };

    const togglePerm = (code: string) => {
        setPermsDraft((prev) => (prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]));
    };

    const savePerms = async () => {
        if (!detail) return;
        setPermsSaving(true);
        setToast(null);
        try {
            const updated = await updateAdminPermissions(detail.id, permsDraft);
            setDetail(updated);
            setPermsDraft(updated.extra_permissions);
            flash('success', 'Extra permissions updated.');
            loadAudits(1, actionFilter);
        } catch (err) {
            flash('error', adminError(err, 'Could not update permissions.'));
        } finally {
            setPermsSaving(false);
        }
    };

    const submitCreate = async () => {
        setCreateError(null);
        const email = createForm.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setCreateError('Enter a valid email address.'); return; }
        if (!createForm.full_name.trim()) { setCreateError('Full name is required.'); return; }
        const issues = passwordIssues(createForm.password);
        if (issues.length) { setCreateError(`Password must contain ${issues.join(', ')}.`); return; }

        setCreateSubmitting(true);
        try {
            const created = await createAdmin({
                email,
                full_name: createForm.full_name.trim(),
                role: createForm.role,
                password: createForm.password,
                phone: createForm.phone.trim() || undefined,
                department: createForm.department.trim() || undefined,
            });
            flash('success', `${created.full_name} was added as ${roleLabel(created.role)}.`);
            setShowAddModal(false);
            setCreateForm(emptyCreateForm);
            loadAdmins();
            loadAudits(1, actionFilter);
        } catch (err) {
            setCreateError(adminError(err, 'Could not create admin.'));
        } finally {
            setCreateSubmitting(false);
        }
    };

    const detailIsSelf = detail?.id === currentAdmin?.id;
    const detailIsSuper = detail?.role === 'SUPER_ADMIN';

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
                <div className="flex border-b border-gray-200">
                    {['Admins', 'Activity Log', 'Roles & Permissions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-all relative",
                                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
                        </button>
                    ))}
                </div>
            </header>

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

            <AnimatePresence mode="wait">
                {activeTab === 'Admins' && (
                    <motion.div key="admins" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                        {canManage && (
                            <button
                                onClick={() => { setCreateError(null); setCreateForm(emptyCreateForm); setShowAddModal(true); }}
                                className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 hover:bg-yellow-500 transition-all active:scale-[0.99]"
                            >
                                <UserCog size={20} /> Add New Admin
                            </button>
                        )}

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrators</h3>
                                <span className="text-xs text-gray-400">{admins.length} total</span>
                            </div>

                            {adminsLoading ? (
                                <Card className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="animate-spin" size={24} /></Card>
                            ) : adminsError ? (
                                <Card><EmptyState icon={AlertCircle} title="Couldn't load admins" description={adminsError} /></Card>
                            ) : admins.length === 0 ? (
                                <Card><EmptyState icon={UserCog} title="No admins yet" /></Card>
                            ) : (
                                admins.map((a) => {
                                    const isSelf = a.id === currentAdmin?.id;
                                    const rowBusy = busy?.id === a.id;
                                    return (
                                        <Card key={a.id} className="flex items-center justify-between p-4 gap-4 flex-wrap">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={`https://picsum.photos/seed/${a.email}/100/100`} className="w-12 h-12 rounded-full object-cover" alt="" />
                                                    <div className={cn('absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full', a.is_active ? 'bg-green-500' : 'bg-gray-400')} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900">{a.full_name || a.email}</h4>
                                                        {isSelf && <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-md uppercase tracking-wider">You</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{roleLabel(a.role)}</span>
                                                        {a.is_locked && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1"><Lock size={10} /> Locked</span>}
                                                        {!a.is_active && <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-md uppercase tracking-wider">Disabled</span>}
                                                        <span className="text-[10px] text-gray-400">Last login: {formatDateTime(a.last_login_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openDetail(a)} title="Manage" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                                                    <SettingsIcon size={18} />
                                                </button>
                                                {canManage && a.is_locked && (
                                                    <button onClick={() => handleUnlock(a)} disabled={rowBusy} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-all disabled:opacity-60">
                                                        {rowBusy && busy?.type === 'unlock' ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />} Unlock
                                                    </button>
                                                )}
                                                {canManage && !isSelf && (
                                                    pendingForceId === a.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => setPendingForceId(null)} disabled={rowBusy} className="px-3 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 disabled:opacity-60">Cancel</button>
                                                            <button onClick={() => handleForceLogout(a)} disabled={rowBusy} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-70">
                                                                {rowBusy && busy?.type === 'force' ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Confirm
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setToast(null); setPendingForceId(a.id); }} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-all">
                                                            <LogOut size={14} /> Force Logout
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h3>
                                <button onClick={() => setActiveTab('Activity Log')} className="text-xs font-bold text-yellow-600 hover:text-yellow-700">View Full Log</button>
                            </div>
                            <Card className="p-0 overflow-hidden">
                                {auditLoading ? (
                                    <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="animate-spin" size={20} /></div>
                                ) : audits.length === 0 ? (
                                    <EmptyState title="No recent activity" />
                                ) : (
                                    audits.slice(0, 4).map((log) => (
                                        <div key={log.id} className="p-4 flex items-center gap-3 border-b border-gray-100 last:border-0">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0', auditActionTone(log.action))}>{auditActionLabel(log.action)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 truncate">
                                                    <span className="font-bold text-gray-900">{log.admin_email}</span>
                                                    {log.target_admin_email && <span className="text-gray-500"> → {log.target_admin_email}</span>}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{formatDateTime(log.created_at)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </Card>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'Activity Log' && (
                    <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Full Activity Log {auditCount > 0 && <span className="text-gray-700">· {auditCount} entries</span>}
                            </h3>
                            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
                                <option value="">All actions</option>
                                {AUDIT_ACTIONS.map((code) => <option key={code} value={code}>{auditActionLabel(code)}</option>)}
                            </select>
                        </div>

                        {!canViewAudit ? (
                            <Card><EmptyState icon={ShieldCheck} title="Restricted" description="You don't have permission to view audit logs." /></Card>
                        ) : (
                            <>
                                <Card className="p-0 overflow-hidden">
                                    {auditLoading ? (
                                        <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
                                    ) : auditError ? (
                                        <EmptyState icon={AlertCircle} title="Couldn't load logs" description={auditError} />
                                    ) : audits.length === 0 ? (
                                        <EmptyState title="No activity logged yet" />
                                    ) : (
                                        audits.map((log) => (
                                            <div key={log.id} className="p-4 flex gap-3 border-b border-gray-100 last:border-0">
                                                <span className={cn('px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider h-fit shrink-0', auditActionTone(log.action))}>{auditActionLabel(log.action)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-bold text-gray-900">{log.admin_email}</span>
                                                        {log.target_admin_email && <span className="text-gray-500"> → {log.target_admin_email}</span>}
                                                    </p>
                                                    {typeof log.metadata?.reason === 'string' && <p className="text-xs text-gray-500 mt-0.5">Reason: {log.metadata.reason}</p>}
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] text-gray-400">{formatDateTime(log.created_at)}</span>
                                                        <span className="text-[10px] text-gray-700">•</span>
                                                        <span className="text-[10px] text-gray-400">{log.ip_address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </Card>
                                {(auditHasPrev || auditHasNext) && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">Page {auditPage}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => loadAudits(auditPage - 1, actionFilter)} disabled={!auditHasPrev || auditLoading} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft size={14} /> Prev</button>
                                            <button onClick={() => loadAudits(auditPage + 1, actionFilter)} disabled={!auditHasNext || auditLoading} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Next <ChevronRight size={14} /></button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {activeTab === 'Roles & Permissions' && (
                    <motion.div key="roles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Roles & Default Permissions</h3>
                        {ADMIN_ROLES.map((role) => (
                            <Card key={role} className="p-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{roleLabel(role)}</h4>
                                        <p className="text-sm text-gray-500 mt-0.5 max-w-md">{ROLE_DESCRIPTIONS[role]}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{ROLE_DEFAULT_PERMISSIONS[role].length} permissions</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {ROLE_DEFAULT_PERMISSIONS[role].map((perm) => (
                                        <span key={perm} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md">{permissionLabel(perm)}</span>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create admin modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !createSubmitting && setShowAddModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
                                <button onClick={() => setShowAddModal(false)} disabled={createSubmitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto">
                                {createError && (
                                    <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{createError}</span>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email *</label>
                                    <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@company.com" disabled={createSubmitting} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
                                    <input type="text" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} placeholder="Alice Kumar" disabled={createSubmitting} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role *</label>
                                    <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as AdminRole })} disabled={createSubmitting} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none disabled:opacity-60">
                                        {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password *</label>
                                    <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 8 chars, upper/lower/digit/special" disabled={createSubmitting} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                                        <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="Optional" disabled={createSubmitting} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Department</label>
                                        <input type="text" value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} placeholder="Optional" disabled={createSubmitting} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowAddModal(false)} disabled={createSubmitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                                <button onClick={submitCreate} disabled={createSubmitting} className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all disabled:opacity-70">
                                    {createSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {createSubmitting ? 'Creating…' : 'Create Admin'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Disable reason modal */}
            <AnimatePresence>
                {disableTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !disableSubmitting && setDisableTarget(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Disable Admin</h2>
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-500">Disabling <span className="font-bold text-gray-900">{disableTarget.full_name || disableTarget.email}</span> revokes all their active sessions immediately. Provide a reason for the audit log.</p>
                                <textarea value={disableReason} onChange={(e) => setDisableReason(e.target.value)} placeholder="e.g. Contract ended" disabled={disableSubmitting} className="w-full h-28 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60" />
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setDisableTarget(null)} disabled={disableSubmitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                                <button onClick={submitDisable} disabled={disableSubmitting || !disableReason.trim()} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                    {disableSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {disableSubmitting ? 'Disabling…' : 'Disable Admin'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Admin detail slide-over */}
            <AnimatePresence>
                {detail && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-gray-900 truncate">{detail.full_name || detail.email}</h2>
                                    <p className="text-xs text-gray-400 truncate">{detail.email}</p>
                                </div>
                                <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {detailLoading && <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={14} className="animate-spin" /> Refreshing…</div>}

                                {/* Info */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-4 grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Role', value: roleLabel(detail.role) },
                                        { label: 'Status', value: detail.is_active ? 'Active' : 'Disabled' },
                                        { label: 'Locked', value: detail.is_locked ? 'Yes' : 'No' },
                                        { label: 'Department', value: detail.department || '—' },
                                        { label: 'Phone', value: detail.phone || '—' },
                                        { label: 'Last Login', value: formatDateTime(detail.last_login_at) },
                                        { label: 'Last Login IP', value: detail.last_login_ip || '—' },
                                        { label: 'Created', value: formatDateTime(detail.created_at) },
                                    ].map((row) => (
                                        <div key={row.label} className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                                            <span className="text-sm text-gray-800 break-all">{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {canManage && (
                                    <>
                                        {/* Change role */}
                                        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Role</h4>
                                            {detailIsSuper ? (
                                                <p className="text-sm text-gray-500">Super Admin role cannot be changed via API.</p>
                                            ) : detailIsSelf ? (
                                                <p className="text-sm text-gray-500">You cannot change your own role.</p>
                                            ) : (
                                                <>
                                                    <select value={roleDraft} onChange={(e) => setRoleDraft(e.target.value as AdminRole)} disabled={roleSaving} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none disabled:opacity-60">
                                                        {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                                                    </select>
                                                    <p className="text-[10px] text-gray-400">Changing the role force-logs the admin out; they must re-login.</p>
                                                    <button onClick={saveRole} disabled={roleSaving || roleDraft === detail.role} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50">
                                                        {roleSaving && <Loader2 size={14} className="animate-spin" />} Save Role
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Extra permissions */}
                                        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Extra Permissions</h4>
                                            {detailIsSuper ? (
                                                <p className="text-sm text-gray-500">Super Admin has all permissions implicitly.</p>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] text-gray-400">Granted on top of the role defaults. Sends the complete list (replaces).</p>
                                                    <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                                                        {PERMISSIONS.map((perm) => {
                                                            const isDefault = ROLE_DEFAULT_PERMISSIONS[detail.role].includes(perm);
                                                            return (
                                                                <label key={perm} className="flex items-center justify-between gap-2 cursor-pointer group py-0.5">
                                                                    <span className="text-xs text-gray-700 group-hover:text-gray-900">
                                                                        {permissionLabel(perm)}
                                                                        {isDefault && <span className="ml-1.5 text-[9px] text-gray-400 uppercase">role default</span>}
                                                                    </span>
                                                                    <input type="checkbox" checked={permsDraft.includes(perm)} onChange={() => togglePerm(perm)} disabled={permsSaving} className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <button onClick={savePerms} disabled={permsSaving} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50">
                                                        {permsSaving && <Loader2 size={14} className="animate-spin" />} Save Permissions
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {canManage && !detailIsSuper && !detailIsSelf && (
                                <div className="p-6 border-t border-gray-200 bg-white">
                                    {detail.is_active ? (
                                        <button onClick={() => { setDisableReason(''); setDisableTarget(detail); }} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all">
                                            <Ban size={16} /> Disable Admin
                                        </button>
                                    ) : (
                                        <button onClick={() => handleEnable(detail)} disabled={busy?.id === detail.id} className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60">
                                            {busy?.id === detail.id ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />} Enable Admin
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

export default AdminManagement;
