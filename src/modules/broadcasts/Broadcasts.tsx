import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    Megaphone,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CheckCircle,
    X,
    ArrowLeft,
    Mail,
    Bell,
    Users,
    Send,
    Ban,
    Clock,
    CalendarClock,
    FlaskConical,
    Link2,
    AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listBroadcasts,
    createBroadcast,
    getBroadcast,
    cancelBroadcast,
    listDeliveries,
    sendBroadcastTest,
    estimateAudience,
    broadcastStatusLabel,
    broadcastStatusTone,
    deliveryStatusTone,
    isBroadcastCancellable,
    BROADCAST_STATUSES,
    BROADCAST_AUDIENCES,
    DELIVERY_CHANNELS,
    DELIVERY_STATUSES,
    ApiError,
    type BroadcastListItem,
    type BroadcastDetail,
    type BroadcastDelivery,
    type BroadcastAudience,
    type CreateBroadcastInput,
} from '../../shared/lib/api';

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

const num = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString());

type Toast = { type: 'success' | 'error'; text: string } | null;

const Broadcasts = () => {
    const { hasPermission } = useAuth();
    // Mass broadcast is a high-privilege, outward-facing action; gate sends on MANAGE_ADMINS.
    const canSend = hasPermission('MANAGE_ADMINS');

    const [view, setView] = useState<'list' | 'compose' | 'detail'>('list');

    // List
    const [items, setItems] = useState<BroadcastListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Detail
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<BroadcastDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deliveries, setDeliveries] = useState<BroadcastDelivery[]>([]);
    const [deliveriesLoading, setDeliveriesLoading] = useState(false);
    const [delChannel, setDelChannel] = useState('');
    const [delStatus, setDelStatus] = useState('');
    const [actionBusy, setActionBusy] = useState<string | null>(null);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const [toast, setToast] = useState<Toast>(null);
    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    const loadList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await listBroadcasts({
                status: statusFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            }));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load broadcasts.');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, dateFrom, dateTo]);

    useEffect(() => {
        if (view === 'list') loadList();
    }, [view, loadList]);

    // --- Detail ---
    const loadDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            setDetail(await getBroadcast(id));
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load broadcast.');
            setView('list');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const loadDeliveries = useCallback(async (id: string, channel: string, status: string) => {
        setDeliveriesLoading(true);
        try {
            setDeliveries(await listDeliveries(id, { channel: channel || undefined, status: status || undefined }));
        } catch {
            setDeliveries([]);
        } finally {
            setDeliveriesLoading(false);
        }
    }, []);

    const openDetail = (id: string) => {
        setSelectedId(id);
        setDetail(null);
        setDeliveries([]);
        setDelChannel('');
        setDelStatus('');
        setView('detail');
        loadDetail(id);
        loadDeliveries(id, '', '');
    };

    // Reload deliveries when the channel/status filter changes (in detail view).
    useEffect(() => {
        if (view === 'detail' && selectedId) loadDeliveries(selectedId, delChannel, delStatus);
    }, [view, selectedId, delChannel, delStatus, loadDeliveries]);

    const backToList = () => {
        setView('list');
        setSelectedId(null);
        setDetail(null);
    };

    const handleSendTest = async () => {
        if (!selectedId) return;
        setActionBusy('test');
        setToast(null);
        try {
            const res = await sendBroadcastTest(selectedId);
            flash('success', res?.detail || 'Test delivery sent to your account.');
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not send the test.');
        } finally {
            setActionBusy(null);
        }
    };

    const handleCancel = async () => {
        if (!selectedId) return;
        setActionBusy('cancel');
        setToast(null);
        try {
            const updated = await cancelBroadcast(selectedId);
            setDetail(updated);
            setConfirmCancel(false);
            flash('success', 'Broadcast cancelled.');
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not cancel the broadcast.');
        } finally {
            setActionBusy(null);
        }
    };

    // =====================================================================
    // Compose view
    // =====================================================================
    if (view === 'compose') {
        return (
            <Composer
                onCancel={() => setView('list')}
                onCreated={(b) => {
                    setSelectedId(b.id);
                    setDetail(b);
                    setDeliveries([]);
                    setView('detail');
                    loadDeliveries(b.id, '', '');
                    flash('success', b.status === 'SCHEDULED' ? 'Broadcast scheduled.' : 'Broadcast created and sending.');
                }}
                flash={flash}
                toast={toast}
                clearToast={() => setToast(null)}
            />
        );
    }

    // =====================================================================
    // Detail view
    // =====================================================================
    if (view === 'detail') {
        const cancellable = !!detail && isBroadcastCancellable(detail.status);
        const stats = detail?.delivery_stats && typeof detail.delivery_stats === 'object' ? Object.entries(detail.delivery_stats) : [];

        return (
            <div className="space-y-6">
                <button onClick={backToList} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} /> Back to Broadcasts
                </button>

                {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

                {detailLoading && !detail ? (
                    <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
                ) : !detail ? (
                    <EmptyState icon={AlertCircle} title="Broadcast not found" description="This broadcast could not be loaded." />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: content + deliveries */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="text-2xl font-bold text-gray-900">{detail.title || 'Untitled broadcast'}</h1>
                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', broadcastStatusTone(detail.status))}>
                                                {broadcastStatusLabel(detail.status)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{detail.subject}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {detail.send_email && <ChannelPill icon={Mail} label="Email" />}
                                        {detail.send_in_app && <ChannelPill icon={Bell} label="In-app" />}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{detail.body}</p>
                                    {detail.action_url && (
                                        <a href={detail.action_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-yellow-600 hover:text-yellow-700">
                                            <Link2 size={14} /> {detail.action_url}
                                        </a>
                                    )}
                                </div>
                            </Card>

                            {/* Delivery stats */}
                            <Card>
                                <h3 className="font-bold text-gray-900 mb-4">Delivery</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <MiniMetric label="Estimated" value={num(detail.estimated_recipients)} />
                                    <MiniMetric label="Recipients" value={num(detail.total_recipients)} />
                                    <MiniMetric label="Sent" value={num(detail.total_sent)} tone="text-green-600" />
                                    <MiniMetric label="Failed" value={num(detail.total_failed)} tone="text-red-600" />
                                </div>
                                {stats.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
                                        {stats.map(([channel, v]) => (
                                            <div key={channel}>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{channel.replace(/_/g, ' ')}</p>
                                                {v && typeof v === 'object' && !Array.isArray(v) ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Object.entries(v as Record<string, unknown>).map(([sk, sv]) => (
                                                            <span key={sk} className="px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium rounded-md">
                                                                {sk.replace(/_/g, ' ')}: <span className="font-bold text-gray-800">{typeof sv === 'number' ? sv.toLocaleString() : String(sv)}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-gray-800">{typeof v === 'number' ? (v as number).toLocaleString() : String(v)}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Deliveries table */}
                            <Card className="p-0 overflow-hidden">
                                <div className="p-5 pb-3 flex items-center justify-between gap-3 flex-wrap">
                                    <h3 className="font-bold text-gray-900">Recipients</h3>
                                    <div className="flex gap-2">
                                        <FilterSelect value={delChannel} onChange={setDelChannel} allLabel="All channels">
                                            {DELIVERY_CHANNELS.map((c) => <option key={c} value={c}>{c === 'IN_APP' ? 'In-app' : 'Email'}</option>)}
                                        </FilterSelect>
                                        <FilterSelect value={delStatus} onChange={setDelStatus} allLabel="All statuses">
                                            {DELIVERY_STATUSES.map((s) => <option key={s} value={s}>{broadcastStatusLabel(s)}</option>)}
                                        </FilterSelect>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50 border-y border-gray-100">
                                                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipient</th>
                                                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Channel</th>
                                                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {deliveriesLoading ? (
                                                <tr><td colSpan={4}><div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="animate-spin" size={20} /></div></td></tr>
                                            ) : deliveries.length === 0 ? (
                                                <tr><td colSpan={4}><div className="py-10 text-center text-sm text-gray-400">No deliveries yet.</div></td></tr>
                                            ) : (
                                                deliveries.map((d) => (
                                                    <tr key={d.id} className="hover:bg-gray-50/50">
                                                        <td className="px-5 py-3 text-sm text-gray-800">{d.email || '—'}</td>
                                                        <td className="px-5 py-3 text-xs text-gray-500">{d.channel === 'IN_APP' ? 'In-app' : d.channel === 'EMAIL' ? 'Email' : d.channel}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', deliveryStatusTone(d.status))} title={d.failure_reason || undefined}>
                                                                {broadcastStatusLabel(d.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-gray-500">{formatDateTime(d.sent_at)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>

                        {/* Right: meta + actions */}
                        <div className="space-y-6">
                            <Card className="lg:sticky lg:top-6">
                                <h3 className="font-bold text-gray-900 mb-4">Details</h3>
                                <div className="space-y-2 mb-4">
                                    <SummaryRow label="Status" value={broadcastStatusLabel(detail.status)} />
                                    <SummaryRow label="Audience" value={audienceLabel(detail.audience_filters)} />
                                    <SummaryRow label="Scheduled" value={formatDateTime(detail.scheduled_at)} />
                                    <SummaryRow label="Sent" value={formatDateTime(detail.sent_at)} />
                                    <SummaryRow label="Created by" value={detail.created_by_name || '—'} />
                                    <SummaryRow label="Created" value={formatDateTime(detail.created_at)} />
                                    {detail.cancelled_at && <SummaryRow label="Cancelled" value={`${formatDateTime(detail.cancelled_at)}${detail.cancelled_by_name ? ` · ${detail.cancelled_by_name}` : ''}`} />}
                                </div>

                                {canSend && (
                                    <div className="space-y-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={handleSendTest}
                                            disabled={actionBusy === 'test'}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm disabled:opacity-60"
                                        >
                                            {actionBusy === 'test' ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />} Send Test to Me
                                        </button>
                                        {cancellable && (
                                            <button
                                                onClick={() => setConfirmCancel(true)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all text-sm"
                                            >
                                                <Ban size={15} /> Cancel Broadcast
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {confirmCancel && (
                        <ConfirmModal
                            title="Cancel Broadcast"
                            blurb="This stops a scheduled or in-progress broadcast. Recipients not yet sent to will not receive it. This cannot be undone."
                            confirmLabel="Cancel Broadcast"
                            danger
                            busy={actionBusy === 'cancel'}
                            onClose={() => actionBusy !== 'cancel' && setConfirmCancel(false)}
                            onConfirm={handleCancel}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // =====================================================================
    // List view
    // =====================================================================
    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
                    <p className="text-gray-500 text-sm">Send notifications to the user app and partner portal</p>
                </div>
                {canSend && (
                    <button
                        onClick={() => setView('compose')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all"
                    >
                        <Plus size={16} /> New Broadcast
                    </button>
                )}
            </header>

            {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <FilterSelect value={statusFilter} onChange={setStatusFilter} allLabel="All statuses">
                    {BROADCAST_STATUSES.map((s) => <option key={s} value={s}>{broadcastStatusLabel(s)}</option>)}
                </FilterSelect>
                <DateInput label="From" value={dateFrom} onChange={setDateFrom} />
                <DateInput label="To" value={dateTo} onChange={setDateTo} />
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Broadcast</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Channels</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipients</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">When</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={5}><EmptyState icon={AlertCircle} title="Couldn't load broadcasts" description={error} /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={5}><EmptyState icon={Megaphone} title="No broadcasts yet" description="Create your first broadcast to notify users and partners." /></td></tr>
                            ) : (
                                items.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openDetail(b.id)}>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{b.title || 'Untitled'}</p>
                                            <p className="text-xs text-gray-400">by {b.created_by_name || '—'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1.5">
                                                {b.send_email && <Mail size={15} className="text-gray-400" />}
                                                {b.send_in_app && <Bell size={15} className="text-gray-400" />}
                                                {!b.send_email && !b.send_in_app && <span className="text-gray-300">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            {b.total_sent != null
                                                ? <><span className="font-bold text-green-600">{num(b.total_sent)}</span> sent{b.total_failed ? <span className="text-red-500"> · {num(b.total_failed)} failed</span> : null}</>
                                                : <span className="text-gray-400">~{num(b.estimated_recipients)} est.</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', broadcastStatusTone(b.status))}>
                                                {broadcastStatusLabel(b.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {b.sent_at ? formatDateTime(b.sent_at) : b.scheduled_at ? <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {formatDateTime(b.scheduled_at)}</span> : formatDateTime(b.created_at)}
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
// Composer
// ---------------------------------------------------------------------------

function Composer({
    onCancel,
    onCreated,
    flash,
    toast,
    clearToast,
}: {
    onCancel: () => void;
    onCreated: (b: BroadcastDetail) => void;
    flash: (type: 'success' | 'error', text: string) => void;
    toast: Toast;
    clearToast: () => void;
}) {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);
    const [audience, setAudience] = useState<BroadcastAudience>('all');
    const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
    const [scheduledAt, setScheduledAt] = useState('');

    const [estimate, setEstimate] = useState<number | null>(null);
    const [estimating, setEstimating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmSend, setConfirmSend] = useState(false);

    const audienceCfg = BROADCAST_AUDIENCES.find((a) => a.value === audience)!;

    // Live audience estimate whenever the audience changes.
    useEffect(() => {
        let cancelled = false;
        setEstimating(true);
        setEstimate(null);
        estimateAudience(audienceCfg.filters)
            .then((r) => { if (!cancelled) setEstimate(r?.count ?? null); })
            .catch(() => { if (!cancelled) setEstimate(null); })
            .finally(() => { if (!cancelled) setEstimating(false); });
        return () => { cancelled = true; };
    }, [audience, audienceCfg.filters]);

    const titleOk = title.trim().length > 0;
    const subjectOk = subject.trim().length > 0;
    const bodyOk = body.trim().length > 0;
    const channelOk = sendEmail || sendInApp;
    const scheduleOk = scheduleMode === 'now' || (!!scheduledAt && new Date(scheduledAt).getTime() > Date.now());
    const formValid = titleOk && subjectOk && bodyOk && channelOk && scheduleOk;

    const buildPayload = (): CreateBroadcastInput => ({
        title: title.trim(),
        subject: subject.trim(),
        body: body.trim(),
        action_url: actionUrl.trim() || undefined,
        send_email: sendEmail,
        send_in_app: sendInApp,
        audience_filters: audienceCfg.filters,
        scheduled_at: scheduleMode === 'later' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    });

    const submit = async () => {
        if (!formValid) return;
        setSubmitting(true);
        clearToast();
        try {
            const created = await createBroadcast(buildPayload());
            setConfirmSend(false);
            onCreated(created);
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Could not create the broadcast.');
            setConfirmSend(false);
        } finally {
            setSubmitting(false);
        }
    };

    const onSubmitClick = () => {
        if (!formValid) return;
        if (scheduleMode === 'now') setConfirmSend(true); // immediate send needs explicit confirm
        else submit();
    };

    return (
        <div className="space-y-6">
            <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={20} /> Back to Broadcasts
            </button>

            <header>
                <h1 className="text-2xl font-bold text-gray-900">New Broadcast</h1>
                <p className="text-gray-500 text-sm">Compose a notification for the user app and/or partner portal</p>
            </header>

            {toast && <ToastBar toast={toast} onClose={clearToast} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="space-y-4">
                        <Labeled label="Title" hint="Internal name for this broadcast" required ok={titleOk}>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. June feature announcement" className={inputCls} />
                        </Labeled>
                        <Labeled label="Subject" hint="Email subject / notification heading" required ok={subjectOk}>
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="e.g. New events are live near you!" className={inputCls} />
                        </Labeled>
                        <Labeled label="Message body" required ok={bodyOk}>
                            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write the message recipients will see…" className={cn(inputCls, 'resize-none')} />
                        </Labeled>
                        <Labeled label="Action URL" hint="Optional — where the notification links to">
                            <input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="https://…" className={inputCls} />
                        </Labeled>
                    </Card>
                </div>

                {/* Right: targeting + delivery */}
                <div className="space-y-6">
                    <Card className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Channels</p>
                            <div className="space-y-2">
                                <Toggle checked={sendEmail} onChange={setSendEmail} icon={Mail} label="Email" />
                                <Toggle checked={sendInApp} onChange={setSendInApp} icon={Bell} label="In-app notification" />
                            </div>
                            {!channelOk && <p className="text-[11px] text-red-500 mt-1.5">Pick at least one channel.</p>}
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Audience</p>
                            <select value={audience} onChange={(e) => setAudience(e.target.value as BroadcastAudience)} className={cn(inputCls, 'cursor-pointer')}>
                                {BROADCAST_AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1.5">{audienceCfg.hint}</p>
                            <div className="mt-3 flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">
                                <Users size={16} className="text-yellow-600 shrink-0" />
                                <p className="text-sm text-gray-700">
                                    {estimating ? 'Estimating…' : estimate == null ? 'Estimate unavailable' : <><span className="font-bold">~{estimate.toLocaleString()}</span> recipients</>}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery</p>
                            <div className="grid grid-cols-2 gap-2">
                                <ModeButton active={scheduleMode === 'now'} onClick={() => setScheduleMode('now')} icon={Send} label="Send now" />
                                <ModeButton active={scheduleMode === 'later'} onClick={() => setScheduleMode('later')} icon={Clock} label="Schedule" />
                            </div>
                            {scheduleMode === 'later' && (
                                <div className="mt-3">
                                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
                                    {!scheduleOk && <p className="text-[11px] text-red-500 mt-1.5">Pick a future date & time.</p>}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onSubmitClick}
                            disabled={!formValid || submitting}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : scheduleMode === 'now' ? <Send size={16} /> : <CalendarClock size={16} />}
                            {scheduleMode === 'now' ? 'Review & Send' : 'Schedule Broadcast'}
                        </button>
                        <p className="text-[11px] text-gray-400 text-center">You can send a test to yourself after creating.</p>
                    </Card>
                </div>
            </div>

            <AnimatePresence>
                {confirmSend && (
                    <ConfirmModal
                        title="Send broadcast now?"
                        blurb={`This will immediately send to ~${estimate != null ? estimate.toLocaleString() : '—'} recipients over ${[sendEmail && 'email', sendInApp && 'in-app'].filter(Boolean).join(' + ')}. This cannot be undone.`}
                        confirmLabel="Send Now"
                        danger
                        busy={submitting}
                        onClose={() => !submitting && setConfirmSend(false)}
                        onConfirm={submit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400';

/** Resolve an audience_filters value into a short label. */
function audienceLabel(filters: Record<string, unknown> | string | null | undefined): string {
    if (!filters || (typeof filters === 'object' && Object.keys(filters).length === 0)) return 'Everyone';
    if (typeof filters === 'string') return filters || 'Everyone';
    const roles = (filters as Record<string, unknown>).roles;
    if (Array.isArray(roles) && roles.length) {
        return roles.map((r) => `${String(r).charAt(0).toUpperCase()}${String(r).slice(1)}s`).join(', ');
    }
    return 'Custom';
}

function ToastBar({ toast, onClose }: { toast: { type: 'success' | 'error'; text: string }; onClose: () => void }) {
    return (
        <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn('flex items-start gap-2 text-sm rounded-xl px-4 py-3 border', toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700')}
        >
            {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{toast.text}</span>
            <button onClick={onClose} className="text-current/60 hover:text-current"><X size={16} /></button>
        </div>
    );
}

function Labeled({ label, hint, required, ok, children }: { label: string; hint?: string; required?: boolean; ok?: boolean; children: ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
                {required && ok && <CheckCircle size={12} className="text-green-500" />}
            </label>
            {children}
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function Toggle({ checked, onChange, icon: Icon, label }: { checked: boolean; onChange: (v: boolean) => void; icon: typeof Mail; label: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium', checked ? 'bg-yellow-50 border-yellow-200 text-gray-900' : 'bg-white border-gray-200 text-gray-500')}
        >
            <Icon size={16} className={checked ? 'text-yellow-600' : 'text-gray-400'} />
            <span className="flex-1 text-left">{label}</span>
            <span className={cn('w-9 h-5 rounded-full relative transition-colors', checked ? 'bg-yellow-400' : 'bg-gray-200')}>
                <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all', checked ? 'left-4.5' : 'left-0.5')} />
            </span>
        </button>
    );
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Send; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn('flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all', active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
        >
            <Icon size={15} /> {label}
        </button>
    );
}

function ChannelPill({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
            <Icon size={13} className="text-gray-400" /> {label}
        </span>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 shrink-0">{label}</span>
            <span className="font-bold text-gray-800 text-right truncate">{value}</span>
        </div>
    );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: string }) {
    return (
        <div className="bg-gray-50/60 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={cn('text-lg font-bold', tone ?? 'text-gray-900')}>{value}</p>
        </div>
    );
}

function FilterSelect({ value, onChange, allLabel, children }: { value: string; onChange: (v: string) => void; allLabel: string; children: ReactNode }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
            <option value="">{allLabel}</option>
            {children}
        </select>
    );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="focus:outline-none text-gray-700" />
        </label>
    );
}

function ConfirmModal({ title, blurb, confirmLabel, danger, busy, onClose, onConfirm }: { title: string; blurb: string; confirmLabel: string; danger?: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 flex items-start gap-3">
                    <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', danger ? 'bg-red-50' : 'bg-yellow-50')}>
                        <AlertTriangle size={22} className={danger ? 'text-red-500' : 'text-yellow-500'} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{blurb}</p>
                    </div>
                </div>
                <div className="p-6 pt-0 flex justify-end gap-3">
                    <button onClick={onClose} disabled={busy} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">Back</button>
                    <button onClick={onConfirm} disabled={busy} className={cn('flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl transition-all disabled:opacity-60', danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600')}>
                        {busy && <Loader2 size={16} className="animate-spin" />} {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default Broadcasts;
