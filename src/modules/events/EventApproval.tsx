import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Eye,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CheckCircle,
    XCircle,
    X,
    ArrowLeft,
    Calendar,
    MapPin,
    FileText,
    History,
    Building2,
    Eye as EyeIcon,
    EyeOff,
    Layers,
    Info,
    Copy,
    Check,
    ExternalLink,
    Mail,
    Hash,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import Select from '../../shared/components/ui/Select';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listListings,
    getListingStats,
    getListing,
    getListingHistory,
    approveListing,
    rejectListing,
    getListingRejectionReasons,
    setListingVisibility,
    listingStatusLabel,
    listingStatusTone,
    listingTypeLabel,
    listingTypeTone,
    listingCategoryName,
    mediaUrl,
    LISTING_TYPES,
    LISTING_STATUSES,
    ApiError,
    type ListingListItem,
    type ListingDetail,
    type ListingReviewLog,
    type ListingStats,
    type ListListingsParams,
    type RejectionReason,
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

/** Humanize a details key, e.g. `start_datetime` -> "Start Datetime". */
function humanizeKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Coerce any scalar API value into renderable text. */
function toText(value: unknown): string {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object' && 'name' in (value as object)) return String((value as { name?: unknown }).name ?? '');
    return '';
}

function isScalar(v: unknown): boolean {
    return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

/** Title-case a snake_case enum token, e.g. `direct_booking` -> "Direct Booking". */
function prettyEnum(s: string): string {
    return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ENUM_TOKEN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/; // all-lowercase word(s), underscore-joined

/** True for a `{ id, name }`-style reference object. */
function isRef(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === 'object' && !Array.isArray(v) && 'name' in (v as object);
}

/** Render a scalar detail value with smart formatting (dates, enums, booleans). */
function SmartValue({ value }: { value: unknown }) {
    if (value == null || value === '') return <span className="text-gray-400">—</span>;
    if (typeof value === 'boolean') {
        return value ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[11px] font-bold rounded-full">
                <Check size={11} /> Yes
            </span>
        ) : (
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-400 text-[11px] font-bold rounded-full">No</span>
        );
    }
    if (typeof value === 'number') return <>{value.toLocaleString()}</>;
    if (typeof value === 'string') {
        if (ISO_DATETIME.test(value)) return <>{formatDateTime(value)}</>;
        if (ISO_DATE.test(value)) return <>{formatDate(value)}</>;
        if (ENUM_TOKEN.test(value) && value.length <= 24 && !value.includes('@')) return <>{prettyEnum(value)}</>;
        return <>{value}</>;
    }
    if (isRef(value)) return <>{String(value.name ?? '')}</>;
    return <>{toText(value)}</>;
}

type Toast = { type: 'success' | 'error'; text: string } | null;

const PAGE_SIZE = 10;

interface EventApprovalProps {
    /** Pre-select a listing vertical (from the Partners sidebar sub-item). */
    listingType?: string;
    /** When true (with `listingType` set), hide the type filter — used as the Listing Directory tab of a vertical dashboard. */
    lockType?: boolean;
}

const EventApproval = ({ listingType = '', lockType = false }: EventApprovalProps) => {
    const { hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_LISTINGS');

    // List + stats
    const [listings, setListings] = useState<ListingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<ListingStats | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    // Seeded from the Partners sub-item; the dropdown can still change it within the tab.
    const [typeFilter, setTypeFilter] = useState(listingType);
    const [page, setPage] = useState(1);

    // Review (detail) view
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ListingDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [logs, setLogs] = useState<ListingReviewLog[]>([]);

    // Action state
    const [directBusy, setDirectBusy] = useState<string | null>(null);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectReasonCodes, setRejectReasonCodes] = useState<string[]>([]);
    const [rejectSubmitting, setRejectSubmitting] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);

    const [toast, setToast] = useState<Toast>(null);
    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, typeFilter]);

    const buildParams = useCallback(
        (): ListListingsParams => ({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            listing_type: typeFilter || undefined,
        }),
        [debouncedSearch, statusFilter, typeFilter],
    );

    const loadListings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setListings(await listListings(buildParams()));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load listings.');
        } finally {
            setLoading(false);
        }
    }, [buildParams]);

    const loadStats = useCallback(async () => {
        try {
            setStats(await getListingStats(typeFilter || undefined));
        } catch {
            /* stats are non-critical */
        }
    }, [typeFilter]);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // --- Review view ---
    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            const [d, l] = await Promise.all([getListing(id), getListingHistory(id).catch(() => [])]);
            setDetail(d);
            setLogs(l as ListingReviewLog[]);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load listing.');
            setSelectedId(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const openReview = (l: ListingListItem) => {
        setSelectedId(l.id);
        setDetail(null);
        setLogs([]);
        loadDetail(l.id);
    };

    const closeReview = () => {
        setSelectedId(null);
        setDetail(null);
        setLogs([]);
        loadListings();
        loadStats();
    };

    const refreshAfterAction = async (id: string) => {
        await loadDetail(id);
        loadStats();
    };

    const runDirect = async (key: string, fn: () => Promise<unknown>, successMsg: string, id: string) => {
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

    const submitReject = async () => {
        if (!selectedId) return;
        const comment = rejectReason.trim();
        if (!comment) return;
        setRejectSubmitting(true);
        try {
            await rejectListing(selectedId, comment, rejectReasonCodes.length ? rejectReasonCodes : undefined);
            flash('success', 'Listing rejected. The partner has been notified.');
            setRejectOpen(false);
            setRejectReason('');
            setRejectReasonCodes([]);
            await refreshAfterAction(selectedId);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not reject the listing.');
        } finally {
            setRejectSubmitting(false);
        }
    };

    // =====================================================================
    // Review (detail) view
    // =====================================================================
    if (selectedId) {
        const status = detail?.status ?? '';
        const type = detail?.listing_type ?? '';
        const isPending = status === 'pending';
        const isPublished = status === 'published';
        const detailEntries = detail?.details ? Object.entries(detail.details) : [];
        const scalarEntries = detailEntries.filter(([, v]) => isScalar(v) && v !== '' && v != null);
        const complexEntries = detailEntries.filter(([, v]) => !isScalar(v) && v != null);
        const coverImage = detail?.media?.find((m) => (m.media_type ?? '').startsWith('image') && m.file);

        return (
            <div className="space-y-6">
                <button
                    onClick={closeReview}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Listings
                </button>

                {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

                {detailLoading && !detail ? (
                    <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
                ) : !detail ? (
                    <EmptyState icon={AlertCircle} title="Listing not found" description="This listing could not be loaded." />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: listing content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Cover + header */}
                            <Card className="p-0 overflow-hidden">
                                {coverImage ? (
                                    <img src={mediaUrl(coverImage.file)} alt="" className="w-full h-56 object-cover" />
                                ) : (
                                    <div className="w-full h-40 bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
                                        <Layers className="text-yellow-400" size={48} />
                                    </div>
                                )}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h1 className="text-2xl font-bold text-gray-900">{detail.title || 'Untitled listing'}</h1>
                                                <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', listingTypeTone(type))}>
                                                    {listingTypeLabel(type)}
                                                </span>
                                                <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', listingStatusTone(status))}>
                                                    {listingStatusLabel(status)}
                                                </span>
                                                {detail.is_paused && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                        <EyeOff size={11} /> Paused
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                                <Building2 size={13} /> {detail.partner_name || '—'}
                                                {detail.partner_email && (
                                                    <a
                                                        href={`mailto:${detail.partner_email}`}
                                                        className="inline-flex items-center gap-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                                    >
                                                        <Mail size={12} /> {detail.partner_email}
                                                    </a>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {detail.short_description && (
                                        <p className="text-sm font-medium text-gray-700">{detail.short_description}</p>
                                    )}
                                    {detail.description && (
                                        <div className="pt-2">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2"><FileText size={16} className="text-yellow-500" /> Description</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{detail.description}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Type-specific details */}
                            {(scalarEntries.length > 0 || complexEntries.length > 0) && (
                                <Card>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Info size={18} className="text-yellow-500" /> {listingTypeLabel(type)} Details
                                    </h3>
                                    {scalarEntries.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                                            {scalarEntries.map(([key, value]) => (
                                                <DetailField key={key} label={humanizeKey(key)} value={value} />
                                            ))}
                                        </div>
                                    )}
                                    {complexEntries.map(([key, value]) => (
                                        <div key={key} className="mt-5 pt-5 border-t border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">{humanizeKey(key)}</p>
                                            <ComplexValue value={value} />
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {/* Media */}
                            <Card>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><FileText size={18} className="text-yellow-500" /> Media & Documents</h3>
                                {detail.media?.length ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {detail.media.map((m, i) => {
                                            const fileUrl = m.file ? mediaUrl(m.file) : null;
                                            const mt = (m.media_type ?? '').toLowerCase();
                                            const isImage = fileUrl && (
                                                /\.(jpg|jpeg|png|webp|gif|svg|bmp)(\?.*)?$/i.test(fileUrl) ||
                                                mt.startsWith('image') ||
                                                mt === 'cover' ||
                                                mt === 'gallery' ||
                                                mt === 'photo' ||
                                                mt === 'thumbnail'
                                            );
                                            const label = m.media_type || 'file';

                                            if (isImage) {
                                                return (
                                                    <button
                                                        key={m.id ?? i}
                                                        type="button"
                                                        onClick={() => setLightbox(fileUrl!)}
                                                        aria-label={`Preview ${label}`}
                                                        className="group relative block rounded-xl overflow-hidden border border-gray-200 hover:border-yellow-300 transition-all"
                                                    >
                                                        <img src={fileUrl!} alt={label} className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                                                            <EyeIcon size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </span>
                                                        <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] font-bold uppercase tracking-wider text-center py-0.5">{label}</span>
                                                    </button>
                                                );
                                            }

                                            // Document / unknown type
                                            return fileUrl ? (
                                                <a
                                                    key={m.id ?? i}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group flex flex-col items-center justify-center h-24 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 hover:border-yellow-300 hover:text-yellow-500 transition-all"
                                                >
                                                    <FileText size={24} />
                                                    <span className="text-[10px] mt-1 uppercase font-bold flex items-center gap-1">{label} <ExternalLink size={10} /></span>
                                                </a>
                                            ) : (
                                                <div
                                                    key={m.id ?? i}
                                                    className="flex flex-col items-center justify-center h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-300"
                                                >
                                                    <FileText size={24} />
                                                    <span className="text-[10px] mt-1 uppercase font-bold">{label}</span>
                                                    <span className="text-[9px] text-gray-400">No file</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No media uploaded.</p>
                                )}
                            </Card>

                            {/* Review history */}
                            <Card>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><History size={18} className="text-yellow-500" /> Review History</h3>
                                {logs.length ? (
                                    <div className="space-y-3">
                                        {logs.map((log) => (
                                            <div key={log.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-gray-900 capitalize">{listingStatusLabel(log.decision)}</span>
                                                        <span className="text-[10px] text-gray-400">{formatDateTime(log.created_at)}</span>
                                                    </div>
                                                    {log.comment && <p className="text-xs text-gray-600 mt-0.5">{log.comment}</p>}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">by {log.reviewed_by_email || 'system'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No review actions recorded yet.</p>
                                )}
                            </Card>
                        </div>

                        {/* Right: moderation actions */}
                        <div className="space-y-6">
                            <Card className="lg:sticky lg:top-6">
                                <h3 className="font-bold text-gray-900 mb-4">Moderation</h3>

                                <div className="space-y-2 mb-4">
                                    <SummaryRow label="Type" value={listingTypeLabel(type)} />
                                    <SummaryRow label="Status" value={listingStatusLabel(status)} />
                                    <SummaryRow label="Visibility" value={detail.is_paused ? 'Paused' : isPublished ? 'Public' : '—'} />
                                    <SummaryRow label="Published" value={formatDate(detail.published_at)} />
                                    <SummaryRow label="Created" value={formatDate(detail.created_at)} />
                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Hash size={12} /> Listing ID</span>
                                        <CopyButton text={detail.id} />
                                    </div>
                                </div>

                                {!canManage ? (
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-4 border-t border-gray-200"><AlertCircle size={14} /> You have read-only access to listings.</p>
                                ) : (
                                    <div className="space-y-2 pt-4 border-t border-gray-200">
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => runDirect('approve', () => approveListing(detail.id), 'Listing approved & published.', detail.id)}
                                                    disabled={directBusy === 'approve'}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-gray-900 font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-60"
                                                >
                                                    {directBusy === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve & Publish
                                                </button>
                                                <button
                                                    onClick={() => { setRejectReason(''); setRejectReasonCodes([]); setRejectOpen(true); }}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                                                >
                                                    <XCircle size={16} /> Reject Listing
                                                </button>
                                            </>
                                        )}

                                        {isPublished && (
                                            detail.is_paused ? (
                                                <button
                                                    onClick={() => runDirect('unpause', () => setListingVisibility(detail.id, false), 'Listing is now visible to the public.', detail.id)}
                                                    disabled={directBusy === 'unpause'}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60"
                                                >
                                                    {directBusy === 'unpause' ? <Loader2 size={16} className="animate-spin" /> : <EyeIcon size={16} />} Unpause (Make Public)
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => runDirect('pause', () => setListingVisibility(detail.id, true), 'Listing paused — hidden from discovery.', detail.id)}
                                                    disabled={directBusy === 'pause'}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-all disabled:opacity-60"
                                                >
                                                    {directBusy === 'pause' ? <Loader2 size={16} className="animate-spin" /> : <EyeOff size={16} />} Pause (Hide)
                                                </button>
                                            )
                                        )}

                                        {!isPending && !isPublished && (
                                            <p className="text-xs text-gray-400">No moderation action available for status "{listingStatusLabel(status)}".</p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* Reject reason modal */}
                <AnimatePresence>
                    {rejectOpen && (
                        <RejectModal
                            reason={rejectReason}
                            setReason={setRejectReason}
                            reasonCodes={rejectReasonCodes}
                            setReasonCodes={setRejectReasonCodes}
                            submitting={rejectSubmitting}
                            onClose={() => !rejectSubmitting && setRejectOpen(false)}
                            onConfirm={submitReject}
                        />
                    )}
                </AnimatePresence>

                {/* Media lightbox */}
                <AnimatePresence>
                    {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
                </AnimatePresence>
            </div>
        );
    }

    // =====================================================================
    // List view
    // =====================================================================
    const statTiles = stats
        ? [
              { label: 'Pending', value: stats.pending, tone: 'text-amber-600' },
              { label: 'Live', value: stats.published, tone: 'text-green-600' },
              { label: 'Rejected', value: stats.rejected, tone: 'text-red-600' },
              { label: 'Total', value: stats.total, tone: 'text-gray-900' },
          ]
        : [];
    const byType = stats?.by_type ? Object.entries(stats.by_type) : [];
    const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
    const pagedListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="space-y-6">
            {!lockType && (
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {typeFilter ? `${listingTypeLabel(typeFilter)} Approval` : 'Listings Approval'}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {typeFilter
                                ? `Review and moderate partner ${listingTypeLabel(typeFilter).toLowerCase()} listings`
                                : 'Review and moderate partner listings of every type'}
                        </p>
                    </div>
                </header>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statTiles.map((m) => (
                    <Card key={m.label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.label}</p>
                        <p className={cn('text-3xl font-bold mt-1', m.tone)}>{m.value}</p>
                    </Card>
                ))}
                {!stats && <Card className="col-span-2 lg:col-span-4 text-center text-gray-400 text-sm py-6">Loading stats…</Card>}
            </div>
            {stats && (byType.length > 0 || stats.draft != null || stats.archived != null) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniMetric label="Draft" value={stats.draft} />
                    <MiniMetric label="Archived" value={stats.archived} />
                    {byType.map(([t, v]) => (
                        <MiniMetric key={t} label={listingTypeLabel(t)} value={v} />
                    ))}
                </div>
            )}

            {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <input
                        type="text"
                        placeholder="Search by title…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                {!lockType && (
                    <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        placeholder="All types"
                        options={[{ value: '', label: 'All types' }, ...LISTING_TYPES.map((t) => ({ value: t, label: listingTypeLabel(t) }))]}
                    />
                )}
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="All statuses"
                    options={[{ value: '', label: 'All statuses' }, ...LISTING_STATUSES.map((s) => ({ value: s, label: listingStatusLabel(s) }))]}
                />
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listing</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listing Owner</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={7}><EmptyState icon={AlertCircle} title="Couldn't load listings" description={error} /></td></tr>
                            ) : listings.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon={Calendar} title="No listings found" description="No listings match the current filters." /></td></tr>
                            ) : (
                                pagedListings.map((l) => (
                                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openReview(l)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={cn('text-sm font-bold', l.title ? 'text-gray-900' : 'text-gray-400 italic')}>
                                                    {l.title || 'Untitled listing'}
                                                </p>
                                                {l.is_paused && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-bold rounded uppercase tracking-wider">
                                                        <EyeOff size={10} /> Paused
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{l.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-600">{l.partner_name || l.partner_email || '—'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', listingTypeTone(l.listing_type))}>
                                                {listingTypeLabel(l.listing_type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{listingCategoryName(l.category) || '—'}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{l.city || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', listingStatusTone(l.status))}>
                                                {listingStatusLabel(l.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(ev) => { ev.stopPropagation(); openReview(l); }}
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
                {!loading && !error && listings.length > 0 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            {listings.length.toLocaleString()} listing{listings.length === 1 ? '' : 's'} · page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function ToastBar({ toast, onClose }: { toast: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
                'flex items-start gap-2 text-sm rounded-xl px-4 py-3 border',
                toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700',
            )}
        >
            {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{toast.text}</span>
            <button onClick={onClose} className="text-current/60 hover:text-current"><X size={16} /></button>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: unknown }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <div className="text-sm font-medium text-gray-800 break-words mt-1"><SmartValue value={value} /></div>
        </div>
    );
}

/** A `{ id, name }` reference rendered as a compact chip (name prominent, id subtle). */
function RefChip({ obj }: { obj: Record<string, unknown> }) {
    const name = String(obj.name ?? '');
    return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-100 rounded-xl">
            <span className="text-sm font-bold text-gray-800">{name || '—'}</span>
            {obj.id != null && <span className="text-[10px] text-gray-400 font-mono">#{String(obj.id)}</span>}
        </span>
    );
}

/** Render an array of objects (e.g. batches, tickets) as a readable table. */
function ObjectTable({ rows }: { rows: Record<string, unknown>[] }) {
    const cols = Array.from(
        rows.reduce((set, row) => {
            Object.entries(row).forEach(([k, v]) => { if (isScalar(v)) set.add(k); });
            return set;
        }, new Set<string>()),
    );
    if (cols.length === 0) return null;
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {cols.map((c) => (
                            <th key={c} className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{humanizeKey(c)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                            {cols.map((c) => (
                                <td key={c} className="px-3 py-2 text-gray-700"><SmartValue value={row[c]} /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** Render a non-scalar details value (array / nested object) safely and legibly. */
function ComplexValue({ value }: { value: unknown }) {
    // {id,name} reference → chip
    if (isRef(value)) return <RefChip obj={value} />;

    if (Array.isArray(value)) {
        if (value.length === 0) return <p className="text-sm text-gray-400">—</p>;
        // Array of scalars → chips
        if (value.every(isScalar)) {
            return (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((v, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-lg"><SmartValue value={v} /></span>
                    ))}
                </div>
            );
        }
        // Array of objects → table
        if (value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
            return <ObjectTable rows={value as Record<string, unknown>[]} />;
        }
        // Mixed → stacked chips
        return (
            <div className="flex flex-wrap gap-1.5">
                {value.map((v, i) => <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-lg">{toText(v) || '—'}</span>)}
            </div>
        );
    }
    // Nested object → field grid
    if (value && typeof value === 'object') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(value as Record<string, unknown>).filter(([, v]) => isScalar(v)).map(([k, v]) => (
                    <DetailField key={k} label={humanizeKey(k)} value={v} />
                ))}
            </div>
        );
    }
    return <p className="text-sm text-gray-700"><SmartValue value={value} /></p>;
}

/** Copy-to-clipboard button with transient confirmation. */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };
    return (
        <button
            onClick={copy}
            title={text}
            className="inline-flex items-center gap-1.5 max-w-[160px] text-gray-700 hover:text-yellow-600 transition-colors"
        >
            <span className="font-mono text-[11px] truncate">{text}</span>
            {copied ? <Check size={13} className="text-green-500 flex-shrink-0" /> : <Copy size={13} className="flex-shrink-0" />}
        </button>
    );
}

/** Full-screen image preview. */
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.img
                src={src}
                alt=""
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="relative max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            />
            <button onClick={onClose} aria-label="Close preview" className="absolute top-6 right-6 p-2 bg-gray-200 hover:bg-white/20 rounded-full text-gray-900 transition-colors">
                <X size={22} />
            </button>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{label}</span>
            <span className="font-bold text-gray-800">{value}</span>
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


function RejectModal({
    reason,
    setReason,
    reasonCodes,
    setReasonCodes,
    submitting,
    onClose,
    onConfirm,
}: {
    reason: string;
    setReason: (v: string) => void;
    reasonCodes: string[];
    setReasonCodes: (v: string[]) => void;
    submitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const [presetReasons, setPresetReasons] = useState<RejectionReason[]>([]);
    const [reasonsLoading, setReasonsLoading] = useState(true);
    const [reasonsError, setReasonsError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const reasons = await getListingRejectionReasons();
                if (!cancelled) setPresetReasons(reasons);
            } catch {
                if (!cancelled) setReasonsError(true);
            } finally {
                if (!cancelled) setReasonsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const toggleCode = (code: string, label: string) => {
        const selected = reasonCodes.includes(code);
        const nextCodes = selected ? reasonCodes.filter((c) => c !== code) : [...reasonCodes, code];
        setReasonCodes(nextCodes);

        const template = nextCodes
            .map((c) => presetReasons.find((r) => r.code === c)?.label)
            .filter(Boolean)
            .join('; ');
        setReason(template ? `${template}.` : '');
    };

    const disabled = submitting || !reason.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Reject Listing</h2>
                    <button onClick={onClose} disabled={submitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-gray-500">Select the reasons for rejection. The comment is stored and emailed to the partner.</p>

                    {/* Preset reason checkboxes */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Rejection Reasons</label>
                        {reasonsLoading ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                                <Loader2 size={14} className="animate-spin" /> Loading reasons…
                            </div>
                        ) : reasonsError ? (
                            <p className="text-xs text-amber-600 py-2">Could not load preset reasons. You can still type a custom comment below.</p>
                        ) : presetReasons.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">No preset reasons configured. Enter a custom comment below.</p>
                        ) : (
                            <div className="space-y-2">
                                {presetReasons.map((r) => {
                                    const checked = reasonCodes.includes(r.code);
                                    return (
                                        <label
                                            key={r.code}
                                            className={cn(
                                                'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                                                checked
                                                    ? 'border-red-200 bg-red-50/60'
                                                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-200',
                                                submitting && 'opacity-60 pointer-events-none',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleCode(r.code, r.label)}
                                                disabled={submitting}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-600"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                                                {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Comment textarea */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Comment for partner
                            <span className="text-red-400 ml-1">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe the issues or add additional context…"
                            disabled={submitting}
                            className="w-full h-28 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            {reasonCodes.length > 0
                                ? `${reasonCodes.length} reason${reasonCodes.length > 1 ? 's' : ''} selected — comment auto-filled. Edit freely.`
                                : 'A comment is required even without preset reasons.'}
                        </p>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
                    <button onClick={onClose} disabled={submitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={disabled}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? 'Rejecting…' : 'Reject Listing'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default EventApproval;
