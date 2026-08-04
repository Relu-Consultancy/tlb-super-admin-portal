import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Eye,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
    ArrowLeft,
    Building2,
    MapPin,
    ShieldCheck,
    Landmark,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Download,
    Users,
    Instagram,
    Facebook,
    Globe,
    History,
    Ban,
    UserCheck,
    BadgeCheck,
    Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import Select from '../../shared/components/ui/Select';
import { cn } from '../../shared/lib/utils';
import PeriodFilter from '../../shared/components/ui/PeriodFilter';
import { resolvePeriodRange, STANDARD_PERIOD_LABELS, type StandardPeriod } from '../../shared/lib/period';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listPartners,
    getPartnerMetrics,
    getPartner,
    getPartnerReviewLogs,
    verifyPartner,
    unverifyPartner,
    verifyPartnerBank,
    approvePartner,
    rejectPartner,
    requestPartnerChanges,
    activatePartner,
    deactivatePartner,
    queuePartnerExport,
    getPartnerExportJob,
    downloadPartnerExport,
    partnerStatusLabel,
    partnerStatusTone,
    isPartnerOnboarding,
    mediaUrl,
    PARTNER_STATUSES,
    PARTNER_CATEGORIES,
    ApiError,
    type PartnerListItem,
    type PartnerDetail,
    type PartnerReviewLog,
    type PartnerMetrics,
    type ListPartnersParams,
} from '../../shared/lib/api';

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return iso;
    }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Toast = { type: 'success' | 'error'; text: string } | null;

/** Text-input actions (reason/comment) configured in one place. */
type ActionKind = 'approve' | 'reject' | 'request-changes' | 'deactivate' | 'unverify';
const ACTION_CONFIG: Record<
    ActionKind,
    {
        title: string;
        blurb: string;
        fieldLabel: string;
        placeholder: string;
        required: boolean;
        confirmLabel: string;
        danger: boolean;
        run: (id: string, text: string) => Promise<unknown>;
    }
> = {
    approve: {
        title: 'Approve Partner',
        blurb: 'Approving moves this partner to “Approved” and activates their account.',
        fieldLabel: 'Comment (optional)',
        placeholder: 'Add an internal note for the review log…',
        required: false,
        confirmLabel: 'Approve Partner',
        danger: false,
        run: (id, text) => approvePartner(id, text),
    },
    'request-changes': {
        title: 'Request Changes',
        blurb: 'Sends the partner back to “Activated Limited” so they can edit and re-submit.',
        fieldLabel: 'What needs to change?',
        placeholder: 'e.g. PAN image is blurry — please re-upload a clear copy.',
        required: true,
        confirmLabel: 'Request Changes',
        danger: false,
        run: (id, text) => requestPartnerChanges(id, text),
    },
    reject: {
        title: 'Reject Partner',
        blurb: 'Rejecting sets the partner to “Rejected” and deactivates their account.',
        fieldLabel: 'Reason for rejection',
        placeholder: 'e.g. Submitted documents could not be verified.',
        required: true,
        confirmLabel: 'Reject Partner',
        danger: true,
        run: (id, text) => rejectPartner(id, text),
    },
    deactivate: {
        title: 'Deactivate Partner',
        blurb: 'Deactivating immediately revokes the partner’s access.',
        fieldLabel: 'Reason for deactivation',
        placeholder: 'e.g. Policy violation reported by customers.',
        required: true,
        confirmLabel: 'Deactivate',
        danger: true,
        run: (id, text) => deactivatePartner(id, text),
    },
    unverify: {
        title: 'Mark Unverified',
        blurb: 'Removes the verified badge from this partner.',
        fieldLabel: 'Reason',
        placeholder: 'e.g. PAN details no longer match records.',
        required: true,
        confirmLabel: 'Mark Unverified',
        danger: true,
        run: (id, text) => unverifyPartner(id, text),
    },
};

interface PartnerManagementProps {
    /** Pre-select (and, with `lockCategory`, fix) a partner category — used as the Partner Directory tab of a vertical dashboard. */
    category?: string;
    /** When true (with `category` set), hide the category filter and derive the metric tiles from the category-scoped partner list instead of the platform-wide metrics endpoint. */
    lockCategory?: boolean;
}

const PartnerManagement = ({ category = '', lockCategory = false }: PartnerManagementProps = {}) => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_PARTNERS');
    const canApprove = hasPermission('APPROVE_PARTNERS') || canManage;

    // List + metrics
    const [partners, setPartners] = useState<PartnerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<PartnerMetrics | null>(null);
    const [period, setPeriod] = useState<StandardPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(category);
    const [verifiedFilter, setVerifiedFilter] = useState<'' | 'true' | 'false'>('');
    const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

    // Review (detail) view
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<PartnerDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [logs, setLogs] = useState<PartnerReviewLog[]>([]);

    // Action state
    const [directBusy, setDirectBusy] = useState<string | null>(null);
    const [actionModal, setActionModal] = useState<ActionKind | null>(null);
    const [actionText, setActionText] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);

    const [exporting, setExporting] = useState(false);
    const [toast, setToast] = useState<Toast>(null);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    const buildParams = useCallback(
        (): ListPartnersParams => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            category: categoryFilter || undefined,
            is_verified: verifiedFilter === '' ? undefined : verifiedFilter === 'true',
            is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        }),
        [debouncedSearch, statusFilter, categoryFilter, verifiedFilter, activeFilter],
    );

    const loadPartners = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listPartners(buildParams());
            setPartners(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load partners.');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const loadMetrics = useCallback(async () => {
        // getPartnerMetrics() has no category param (platform-wide only) — when locked to one
        // category, the tiles are derived from the category-scoped `partners` list instead (below).
        if (lockCategory) return;
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        try {
            setMetrics(await getPartnerMetrics(resolvePeriodRange(period, dateFrom, dateTo)));
        } catch {
            /* metrics are non-critical */
        }
    }, [period, dateFrom, dateTo, lockCategory]);

    useEffect(() => {
        loadPartners();
    }, [loadPartners]);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    /** Metric tiles derived client-side from the category-scoped partner list (used only when `lockCategory`). */
    const scopedMetrics = (() => {
        if (!lockCategory) return null;
        const { date_from, date_to } = resolvePeriodRange(period, dateFrom, dateTo);
        const inPeriod = (createdAt: string) => {
            const d = createdAt.slice(0, 10);
            return (!date_from || d >= date_from) && (!date_to || d <= date_to);
        };
        return {
            total: partners.length,
            active: partners.filter((p) => p.is_active).length,
            inactive: partners.filter((p) => !p.is_active).length,
            profileIncomplete: partners.filter((p) => isPartnerOnboarding(p.status)).length,
            reviewPending: partners.filter((p) => p.status === 'under_review').length,
            newInPeriod: partners.filter((p) => inPeriod(p.created_at)).length,
        };
    })();

    // --- Review view ---
    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            const [d, l] = await Promise.all([getPartner(id), getPartnerReviewLogs(id).catch(() => [])]);
            setDetail(d);
            setLogs(l as PartnerReviewLog[]);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load partner.');
            setSelectedId(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const openReview = (p: PartnerListItem) => {
        setSelectedId(p.id);
        setDetail(null);
        setLogs([]);
        loadDetail(p.id);
    };

    const closeReview = () => {
        setSelectedId(null);
        setDetail(null);
        setLogs([]);
        loadPartners();
        loadMetrics();
    };

    /** Refresh everything after a workflow action. */
    const refreshAfterAction = async (id: string) => {
        await loadDetail(id);
        loadMetrics();
    };

    // Direct (no-text) actions: verify, verify-bank, activate.
    const runDirect = async (
        key: string,
        fn: () => Promise<unknown>,
        successMsg: string,
        id: string,
    ) => {
        setDirectBusy(key);
        setToast(null);
        try {
            await fn();
            flash('success', successMsg);
            await refreshAfterAction(id);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Action failed.');
        } finally {
            setDirectBusy(null);
        }
    };

    const submitAction = async () => {
        if (!actionModal || !selectedId) return;
        const cfg = ACTION_CONFIG[actionModal];
        const text = actionText.trim();
        if (cfg.required && !text) return;
        setActionSubmitting(true);
        try {
            await cfg.run(selectedId, text);
            flash('success', `${cfg.title} — done.`);
            setActionModal(null);
            setActionText('');
            await refreshAfterAction(selectedId);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Action failed.');
        } finally {
            setActionSubmitting(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setToast(null);
        try {
            let job = await queuePartnerExport(buildParams());
            const isDone = (s: string) => ['done', 'completed', 'success', 'ready'].includes(s);
            const isFailed = (s: string) => ['failed', 'error', 'failure'].includes(s);
            for (let i = 0; i < 40 && !isDone(job.status) && !isFailed(job.status); i++) {
                await delay(1500);
                job = await getPartnerExportJob(job.job_id);
            }
            if (isFailed(job.status)) {
                flash('error', job.error ? `Export failed: ${job.error}` : 'Export job failed on the server.');
                return;
            }
            if (!isDone(job.status)) {
                flash('error', 'Export is taking longer than expected — try again shortly.');
                return;
            }
            const jobId = job.job_id;
            const blob = await downloadPartnerExport(jobId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'partners-export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            flash('success', 'Partner CSV downloaded.');
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not export partners.');
        } finally {
            setExporting(false);
        }
    };

    const openAction = (kind: ActionKind) => {
        setActionText('');
        setActionModal(kind);
    };

    // =====================================================================
    // Review (detail) view
    // =====================================================================
    if (selectedId) {
        const bankVerified = !!detail?.bank_detail?.is_verified;
        const identityVerified = !!detail?.is_verified;
        const status = detail?.status ?? '';
        const canDecide = status === 'under_review' || status === 'activated_limited';

        return (
            <div className="space-y-6">
                <button
                    onClick={closeReview}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Partners
                </button>

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

                {detailLoading && !detail ? (
                    <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
                ) : !detail ? (
                    <EmptyState icon={AlertCircle} title="Partner not found" description="This partner could not be loaded." />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: profile + documents + bank + media + logs */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Business header */}
                            <Card>
                                <div className="flex items-start gap-4">
                                    {detail.extended_profile?.logo ? (
                                        <img src={mediaUrl(detail.extended_profile.logo)} alt="" className="w-16 h-16 rounded-2xl object-cover border border-gray-200" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center">
                                            <Building2 className="text-yellow-500" size={28} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="text-xl font-bold text-gray-900">{detail.profile?.business_name || detail.email}</h1>
                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', partnerStatusTone(status))}>
                                                {partnerStatusLabel(status)}
                                            </span>
                                            {isPartnerOnboarding(status) && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-gray-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                    <Sparkles size={11} /> New — Onboarding
                                                </span>
                                            )}
                                            {identityVerified && <BadgeCheck size={16} className="text-green-500" />}
                                        </div>
                                        {detail.profile?.business_name && detail.profile.business_name !== detail.email && (
                                            <p className="text-sm text-gray-500 mt-0.5">{detail.email}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {detail.id}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1"><Building2 size={12} /> {detail.profile?.business_type || '—'}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {detail.profile?.base_city || '—'}</span>
                                            <span className="flex items-center gap-1"><Users size={12} /> {detail.follower_count} followers</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                                    <Field label="Contact Person" value={detail.profile?.contact_person_name} />
                                    <Field label="Contact Number" value={detail.extended_profile?.contact_number} />
                                    <Field label="Base City" value={detail.profile?.base_city} />
                                    <Field label="Safety Confirmed" value={detail.profile?.is_safety_confirmed ? 'Yes' : 'No'} />
                                    <Field label="Info Correct" value={detail.profile?.is_info_correct ? 'Yes' : 'No'} />
                                    <Field label="Agreement Accepted" value={formatDate(detail.agreement_accepted_at)} />
                                </div>

                                {detail.extended_profile?.bio && (
                                    <p className="text-sm text-gray-600 leading-relaxed mt-4 pt-4 border-t border-gray-100">{detail.extended_profile.bio}</p>
                                )}

                                <div className="flex items-center gap-2 mt-4">
                                    {detail.categories?.map((c) => (
                                        <span key={c} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{c}</span>
                                    ))}
                                </div>
                                {detail.operating_cities?.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5 flex-wrap">
                                        <MapPin size={12} /> Operating in: {detail.operating_cities.join(', ')}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                    {detail.profile?.instagram_url && <SocialLink href={detail.profile.instagram_url} icon={Instagram} label="Instagram" />}
                                    {detail.profile?.facebook_url && <SocialLink href={detail.profile.facebook_url} icon={Facebook} label="Facebook" />}
                                    {detail.profile?.website_url && <SocialLink href={detail.profile.website_url} icon={Globe} label="Website" />}
                                </div>
                            </Card>

                            {/* STAGE 1 — Verification (identity / documents) */}
                            <Card>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><ShieldCheck size={18} className="text-yellow-500" /> Identity & Documents</h3>
                                    <StageBadge done={identityVerified} />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <Field label="PAN Number" value={detail.verification?.pan_number} />
                                    <Field label="GST Number" value={detail.verification?.gst_number} />
                                    <Field label="PAN Verified" value={detail.verification?.is_pan_verified ? 'Yes' : 'No'} />
                                </div>
                                {canManage && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                        {!identityVerified ? (
                                            <button
                                                onClick={() => runDirect('verify', () => verifyPartner(detail.id), 'Partner marked as verified.', detail.id)}
                                                disabled={directBusy === 'verify'}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60"
                                            >
                                                {directBusy === 'verify' ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Verify Identity
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openAction('unverify')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"
                                            >
                                                <XCircle size={14} /> Mark Unverified
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* STAGE 1 — Bank details */}
                            <Card>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Landmark size={18} className="text-yellow-500" /> Bank Details</h3>
                                    <StageBadge done={bankVerified} />
                                </div>
                                {detail.bank_detail ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <Field label="Account Holder" value={detail.bank_detail.account_holder_name} />
                                            <Field label="Account Number" value={detail.bank_detail.account_number} />
                                            <Field label="IFSC Code" value={detail.bank_detail.ifsc_code} />
                                        </div>
                                        {canManage && !bankVerified && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={() => runDirect('verify-bank', () => verifyPartnerBank(detail.id), 'Bank details verified.', detail.id)}
                                                    disabled={directBusy === 'verify-bank'}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60"
                                                >
                                                    {directBusy === 'verify-bank' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Verify Bank Details
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400">No bank details submitted yet.</p>
                                )}
                            </Card>

                            {/* Media / documents */}
                            <Card>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><FileText size={18} className="text-yellow-500" /> Uploaded Media & Documents</h3>
                                {detail.media?.length ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {detail.media.map((m) => {
                                            const isImage = m.file && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(m.file);
                                            return (
                                                <a
                                                    key={m.id}
                                                    href={m.file ? mediaUrl(m.file) : '#'}
                                                    target={m.file ? "_blank" : undefined}
                                                    rel="noreferrer"
                                                    onClick={(e) => { if (!m.file) e.preventDefault(); }}
                                                    className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-yellow-300 transition-all"
                                                >
                                                    {isImage ? (
                                                        <img src={mediaUrl(m.file)} alt="" className="w-full h-24 object-cover" />
                                                    ) : (
                                                        <div className="w-full h-24 bg-gray-50 flex flex-col items-center justify-center text-gray-400 group-hover:text-yellow-500">
                                                            <FileText size={24} />
                                                            <span className="text-[10px] mt-1 uppercase font-bold text-center px-1">{m.media_type || 'file'}</span>
                                                        </div>
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No media uploaded.</p>
                                )}
                            </Card>

                            {/* Review logs */}
                            <Card>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><History size={18} className="text-yellow-500" /> Review History</h3>
                                {logs.length ? (
                                    <div className="space-y-3">
                                        {logs.map((log) => (
                                            <div key={log.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-gray-900 capitalize">{partnerStatusLabel(log.decision)}</span>
                                                        <span className="text-[10px] text-gray-400">{formatDateTime(log.created_at)}</span>
                                                    </div>
                                                    {log.comment && <p className="text-xs text-gray-600 mt-0.5">{log.comment}</p>}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">by {log.reviewed_by_admin_email || 'system'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No review actions recorded yet.</p>
                                )}
                            </Card>
                        </div>

                        {/* Right: workflow + actions */}
                        <div className="space-y-6">
                            <Card className="lg:sticky lg:top-6">
                                <h3 className="font-bold text-gray-900 mb-4">Review Workflow</h3>

                                {/* Stage stepper */}
                                <div className="space-y-3 mb-5">
                                    <Step n={1} title="Verify Documents & Bank" done={identityVerified && bankVerified} active={!(identityVerified && bankVerified)} />
                                    <Step n={2} title="Final Approval" done={status === 'approved'} active={identityVerified && bankVerified && canDecide} />
                                </div>

                                <div className="space-y-2 mb-4">
                                    <SummaryRow label="Identity" ok={identityVerified} />
                                    <SummaryRow label="Bank" ok={bankVerified} />
                                    <SummaryRow label="Account Active" ok={detail.is_active} />
                                </div>

                                {!canApprove && !canManage ? (
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5"><AlertCircle size={14} /> You have read-only access to partners.</p>
                                ) : (
                                    <div className="space-y-2 pt-4 border-t border-gray-200">
                                        {/* Stage 2 — decisions */}
                                        {canApprove && canDecide && (
                                            <>
                                                {status === 'under_review' && (
                                                    <button
                                                        onClick={() => openAction('approve')}
                                                        disabled={!identityVerified || !bankVerified}
                                                        title={!identityVerified || !bankVerified ? 'Verify identity and bank details first' : undefined}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-gray-900 font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle size={16} /> Approve Partner
                                                    </button>
                                                )}
                                                {status === 'under_review' && (
                                                    <button
                                                        onClick={() => openAction('request-changes')}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition-all"
                                                    >
                                                        <RefreshCw size={16} /> Request Changes
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openAction('reject')}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                                                >
                                                    <XCircle size={16} /> Reject Partner
                                                </button>
                                            </>
                                        )}
                                        {canApprove && !canDecide && status !== 'approved' && (
                                            <p className="text-xs text-gray-400">No review decision available for status “{partnerStatusLabel(status)}”.</p>
                                        )}

                                        {/* Account activation */}
                                        {canManage && (
                                            <div className="pt-2">
                                                {detail.is_active ? (
                                                    <button
                                                        onClick={() => openAction('deactivate')}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                                                    >
                                                        <Ban size={15} /> Deactivate Account
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => runDirect('activate', () => activatePartner(detail.id), 'Partner account activated.', detail.id)}
                                                        disabled={directBusy === 'activate'}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm disabled:opacity-60"
                                                    >
                                                        {directBusy === 'activate' ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />} Activate Account
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* Text-input action modal */}
                <AnimatePresence>
                    {actionModal && (
                        <ActionModal
                            kind={actionModal}
                            text={actionText}
                            setText={setActionText}
                            submitting={actionSubmitting}
                            onClose={() => !actionSubmitting && setActionModal(null)}
                            onConfirm={submitAction}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // =====================================================================
    // List view
    // =====================================================================
    const metricTiles = scopedMetrics
        ? [
              { label: 'Total Partners', value: scopedMetrics.total, tone: 'text-gray-900' },
              { label: 'Review Pending', value: scopedMetrics.reviewPending, tone: 'text-blue-600' },
              { label: 'Active', value: scopedMetrics.active, tone: 'text-green-600' },
              { label: 'Inactive', value: scopedMetrics.inactive, tone: 'text-red-600' },
          ]
        : metrics
        ? [
              { label: 'Total Partners', value: metrics.total_partners, tone: 'text-gray-900' },
              { label: 'Under Review', value: metrics.under_review, tone: 'text-blue-600' },
              { label: 'Approved', value: metrics.approved, tone: 'text-green-600' },
              { label: 'Rejected', value: metrics.rejected, tone: 'text-red-600' },
          ]
        : [];
    const metricsReady = lockCategory ? !loading : !!metrics;

    return (
        <div className="space-y-6">
            <header className={cn('flex flex-col md:flex-row md:items-center gap-4', lockCategory ? 'justify-end' : 'justify-between')}>
                {!lockCategory && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
                        <p className="text-gray-500 text-sm">Review documents & banking, then approve partners</p>
                    </div>
                )}
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
                {!metricsReady && <Card className="col-span-2 lg:col-span-4 text-center text-gray-400 text-sm py-6">Loading metrics…</Card>}
            </div>
            {scopedMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <MiniMetric label="Profile Incomplete" value={scopedMetrics.profileIncomplete} />
                    <MiniMetric label={`New (${STANDARD_PERIOD_LABELS[period]})`} value={scopedMetrics.newInPeriod} />
                </div>
            ) : metrics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <MiniMetric label="Activated Limited" value={metrics.activated_limited} />
                    <MiniMetric label="Verified" value={metrics.is_verified_count} />
                    <MiniMetric label="Enabled Partners" value={metrics.is_active_count} />
                    <MiniMetric label="Active Partners (30d)" value={metrics.active_partners_30d} />
                    <MiniMetric label="New Partners" value={metrics.new_this_month} />
                </div>
            ) : null}

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

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <input
                        type="text"
                        placeholder="Search by email, business, or contact…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="All statuses"
                    options={[{ value: '', label: 'All statuses' }, ...PARTNER_STATUSES.map((s) => ({ value: s, label: partnerStatusLabel(s) }))]}
                />
                {!lockCategory && (
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        placeholder="All categories"
                        options={[{ value: '', label: 'All categories' }, ...PARTNER_CATEGORIES.map((c) => ({ value: c, label: c }))]}
                    />
                )}
                <Select
                    value={verifiedFilter}
                    onChange={(v) => setVerifiedFilter(v as '' | 'true' | 'false')}
                    placeholder="Any verification"
                    options={[
                        { value: '', label: 'Any verification' },
                        { value: 'true', label: 'Verified' },
                        { value: 'false', label: 'Unverified' },
                    ]}
                />
                <Select
                    value={activeFilter}
                    onChange={(v) => setActiveFilter(v as '' | 'true' | 'false')}
                    placeholder="Any account"
                    options={[
                        { value: '', label: 'Any account' },
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
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={7}><EmptyState icon={AlertCircle} title="Couldn't load partners" description={error} /></td></tr>
                            ) : partners.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon={Users} title="No partners found" description="No partners match the current filters." /></td></tr>
                            ) : (
                                partners.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openReview(p)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={cn('text-sm font-bold', p.business_name ? 'text-gray-900' : 'text-gray-400 italic')}>
                                                    {p.business_name || p.contact_person_name || 'Unnamed partner'}
                                                </p>
                                                {isPartnerOnboarding(p.status) && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400 text-gray-900 text-[9px] font-bold rounded uppercase tracking-wider">
                                                        <Sparkles size={10} /> New
                                                    </span>
                                                )}
                                                {!p.business_name && (
                                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded uppercase tracking-wider">
                                                        Incomplete profile
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{p.email}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {p.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap max-w-[180px]">
                                                {p.categories?.length ? p.categories.map((c) => (
                                                    <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">{c}</span>
                                                )) : <span className="text-gray-700">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{p.base_city || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', partnerStatusTone(p.status))}>
                                                {partnerStatusLabel(p.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.is_verified ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 text-[11px] font-bold"><BadgeCheck size={14} /> Verified</span>
                                            ) : (
                                                <span className="text-gray-400 text-[11px] font-bold">Unverified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatDate(p.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openReview(p); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all"
                                            >
                                                <Eye size={14} /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm text-gray-800 break-words mt-0.5">{value || '—'}</p>
        </div>
    );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: typeof Globe; label: string }) {
    return (
        <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-yellow-600 transition-colors">
            <Icon size={14} /> {label}
        </a>
    );
}

function StageBadge({ done }: { done: boolean }) {
    return done ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider"><CheckCircle size={12} /> Verified</span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-wider"><Clock size={12} /> Pending</span>
    );
}

function Step({ n, title, done, active }: { n: number; title: string; done: boolean; active: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                done ? 'bg-green-500 text-gray-900' : active ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-400',
            )}>
                {done ? <CheckCircle size={15} /> : n}
            </div>
            <span className={cn('text-sm font-bold', done ? 'text-gray-900' : active ? 'text-gray-900' : 'text-gray-400')}>{title}</span>
        </div>
    );
}

function SummaryRow({ label, ok }: { label: string; ok: boolean }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{label}</span>
            {ok ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-gray-700" />}
        </div>
    );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}


function ActionModal({
    kind,
    text,
    setText,
    submitting,
    onClose,
    onConfirm,
}: {
    kind: ActionKind;
    text: string;
    setText: (v: string) => void;
    submitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const cfg = ACTION_CONFIG[kind];
    const disabled = submitting || (cfg.required && !text.trim());
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">{cfg.title}</h2>
                    <button onClick={onClose} disabled={submitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">{cfg.blurb}</p>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{cfg.fieldLabel}</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={cfg.placeholder}
                            disabled={submitting}
                            className="w-full h-28 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60"
                        />
                    </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={submitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={disabled}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 text-gray-900 font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                            cfg.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600',
                        )}
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? 'Working…' : cfg.confirmLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default PartnerManagement;
