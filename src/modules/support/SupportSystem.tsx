import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Search,
    MessageSquare,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    Tag,
    Mail,
    User,
    Calendar,
    Info,
    Headphones,
    Loader2,
    RefreshCw,
    Hash,
    Ticket as TicketIcon,
    XCircle,
    RotateCcw,
    ShieldCheck,
    Share2,
    Building2,
    X,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    listTickets,
    getTicket,
    getTicketMessages,
    sendTicketMessage,
    updateTicketStatus,
    shareTicketWithPartner,
    listPartners,
    ticketStatusLabel,
    ticketStatusTone,
    ticketCategoryLabel,
    ticketPollInterval,
    ApiError,
    type SupportTicket,
    type TicketMessage,
    type PartnerListItem,
} from '../../shared/lib/api';

type TabFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

const TABS: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
];

const NON_ADMIN_ROLES = new Set(['customer', 'partner', 'user']);

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function initials(email: string | null | undefined): string {
    if (!email) return '?';
    const name = email.split('@')[0] || email;
    return name.slice(0, 2).toUpperCase() || '?';
}

type Toast = { type: 'success' | 'error'; text: string } | null;

const SupportSystem = () => {
    const { admin, hasPermission } = useAuth();
    const canManage = hasPermission('MANAGE_ENQUIRIES');

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeFilter, setActiveFilter] = useState<TabFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);

    const [statusBusy, setStatusBusy] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const [toast, setToast] = useState<Toast>(null);

    // Share with partner
    const [shareOpen, setShareOpen] = useState(false);
    const [shareBusy, setShareBusy] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastStampRef = useRef<string | null>(null);

    const flash = (type: 'success' | 'error', text: string) => setToast({ type, text });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedId]);

    // --- Load all tickets (filtering happens client-side for accurate tab counts) ---
    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listTickets();
            setTickets(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load tickets.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // --- Load the full thread for the selected ticket (no `since` → full load) ---
    const loadMessages = useCallback(async (ticketId: string) => {
        setMessagesLoading(true);
        lastStampRef.current = null; // reset cursor so we full-load on (re)open
        try {
            const thread = await getTicketMessages(ticketId);
            setMessages(thread.messages);
            lastStampRef.current = thread.messages.length
                ? thread.messages[thread.messages.length - 1].created_at
                : null;
            // Keep the row/detail status in sync with the live thread status.
            if (thread.ticket_status) {
                setSelectedTicket((prev) => (prev && prev.status !== thread.ticket_status ? { ...prev, status: thread.ticket_status } : prev));
            }
        } catch (err) {
            flash('error', err instanceof ApiError ? err.message : 'Failed to load conversation.');
            setMessages([]);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    const selectTicket = useCallback(
        async (ticket: SupportTicket) => {
            setSelectedId(ticket.id);
            setSelectedTicket(ticket);
            setMessageInput('');
            loadMessages(ticket.id);
            // Refresh detail in the background for the latest status/fields.
            try {
                const fresh = await getTicket(ticket.id);
                setSelectedTicket(fresh);
                setTickets((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
            } catch {
                /* keep row data */
            }
        },
        [loadMessages],
    );

    // --- Poll for new messages while a ticket is open ---
    // Cadence follows ticket status (in_progress 5s, open 30s, resolved 60s);
    // a closed ticket stops polling entirely.
    const pollMs = selectedTicket ? ticketPollInterval(selectedTicket.status) : null;
    useEffect(() => {
        if (!selectedId || pollMs == null) return;
        const interval = setInterval(async () => {
            try {
                // Send the cursor verbatim (server UTC, ends in "Z"). Never reformat.
                const since = lastStampRef.current ?? undefined;
                const thread = await getTicketMessages(selectedId, since);
                if (thread.messages.length) {
                    setMessages((prev) => {
                        const seen = new Set(prev.map((m) => m.id));
                        const added = thread.messages.filter((m) => !seen.has(m.id));
                        if (!added.length) return prev;
                        const merged = [...prev, ...added];
                        lastStampRef.current = merged[merged.length - 1].created_at;
                        return merged;
                    });
                }
                // Reflect a live status change (e.g. ticket got closed elsewhere).
                if (thread.ticket_status) {
                    setSelectedTicket((prev) => (prev && prev.status !== thread.ticket_status ? { ...prev, status: thread.ticket_status } : prev));
                    setTickets((prev) => prev.map((t) => (t.id === selectedId && t.status !== thread.ticket_status ? { ...t, status: thread.ticket_status } : t)));
                }
            } catch {
                /* transient — try again next tick */
            }
        }, pollMs);
        return () => clearInterval(interval);
    }, [selectedId, pollMs]);

    const handleSend = async () => {
        const body = messageInput.trim();
        if (!body || !selectedId || sending) return;
        setSending(true);
        try {
            const msg = await sendTicketMessage(selectedId, body);
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                const merged = [...prev, msg];
                lastStampRef.current = merged[merged.length - 1].created_at;
                return merged;
            });
            setMessageInput('');
            // The first admin reply auto-transitions the ticket open → in_progress.
            setSelectedTicket((prev) => (prev && prev.status === 'open' ? { ...prev, status: 'in_progress' } : prev));
            setTickets((prev) => prev.map((t) => (t.id === selectedId && t.status === 'open' ? { ...t, status: 'in_progress' } : t)));
        } catch (err) {
            const text =
                err instanceof ApiError
                    ? err.code === 'NOT_FOUND'
                        ? 'This ticket no longer exists.'
                        : err.code === 'TICKET_CLOSED'
                            ? 'This ticket is closed — no more replies can be sent.'
                            : err.message
                    : 'Could not send your reply.';
            flash('error', text);
        } finally {
            setSending(false);
        }
    };

    const changeStatus = async (status: string) => {
        if (!selectedId || statusBusy) return;
        setStatusBusy(true);
        setToast(null);
        try {
            const updated = await updateTicketStatus(selectedId, status);
            setSelectedTicket(updated);
            setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            flash('success', `Ticket marked as ${ticketStatusLabel(updated.status)}.`);
        } catch (err) {
            const text =
                err instanceof ApiError
                    ? err.code === 'NOT_FOUND'
                        ? 'This ticket no longer exists.'
                        : err.code === 'TICKET_CLOSED'
                            ? 'This ticket is closed and can no longer be updated.'
                            : err.code === 'INVALID_STATUS'
                                ? 'That status value is not valid.'
                                : err.message
                    : 'Could not update the ticket.';
            flash('error', text);
        } finally {
            setStatusBusy(false);
        }
    };

    const handleShare = async (partnerId: string, note: string) => {
        if (!selectedId || shareBusy) return;
        setShareBusy(true);
        setToast(null);
        try {
            const updated = await shareTicketWithPartner(selectedId, partnerId, note || undefined);
            setSelectedTicket(updated);
            setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            flash('success', `Ticket shared with ${updated.shared_with_partner_name || 'partner'}.`);
            setShareOpen(false);
            loadMessages(selectedId);
        } catch (err) {
            const text =
                err instanceof ApiError
                    ? err.code === 'SHARE_NOT_ALLOWED'
                        ? 'Only customer-raised tickets can be shared with a partner.'
                        : err.code === 'TICKET_CLOSED'
                            ? 'This ticket is closed and cannot be shared.'
                            : err.code === 'PARTNER_NOT_FOUND'
                                ? 'The selected partner was not found.'
                                : err.message
                    : 'Could not share the ticket.';
            flash('error', text);
        } finally {
            setShareBusy(false);
        }
    };

    // --- Derived data ---
    const counts = {
        all: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        in_progress: tickets.filter((t) => t.status === 'in_progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        closed: tickets.filter((t) => t.status === 'closed').length,
    };

    const categories = Array.from(new Set(tickets.map((t) => t.category).filter(Boolean))).sort();

    const filteredTickets = tickets.filter((t) => {
        const matchesTab = activeFilter === 'all' || t.status === activeFilter;
        const matchesCategory = !categoryFilter || t.category === categoryFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            t.raised_by_email.toLowerCase().includes(q) ||
            (t.subject || '').toLowerCase().includes(q) ||
            (t.booking_reference || '').toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q);
        return matchesTab && matchesCategory && matchesSearch;
    });

    const isResolvedOrClosed =
        selectedTicket?.status === 'resolved' || selectedTicket?.status === 'closed';

    const isAdminMessage = (m: TicketMessage) =>
        (admin && m.sender_email === admin.email) || (!NON_ADMIN_ROLES.has(m.sender_role?.toLowerCase()));

    const isPartnerMessage = (m: TicketMessage) =>
        m.sender_role?.toLowerCase() === 'partner';

    return (
        <div className="space-y-5">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { key: 'all' as TabFilter, label: 'Total Tickets', value: counts.all, icon: MessageSquare, color: 'text-gray-700', bg: 'bg-gray-50' },
                    { key: 'open' as TabFilter, label: 'Open', value: counts.open, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { key: 'in_progress' as TabFilter, label: 'In Progress', value: counts.in_progress, icon: Headphones, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { key: 'resolved' as TabFilter, label: 'Resolved', value: counts.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat) => (
                    <Card
                        key={stat.key}
                        className={cn(
                            'flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow',
                            activeFilter === stat.key && 'ring-2 ring-yellow-400',
                        )}
                        onClick={() => setActiveFilter(stat.key)}
                    >
                        <div className={cn('p-3 rounded-xl', stat.bg)}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : stat.value}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

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
                    {toast.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                    <span className="flex-1">{toast.text}</span>
                    <button onClick={() => setToast(null)} className="text-current/60 hover:text-current"><XCircle size={16} /></button>
                </div>
            )}

            {/* Main Layout */}
            <div className="h-[calc(100vh-320px)] min-h-[480px] flex gap-4">
                {/* Ticket List Panel */}
                <div className="w-80 flex flex-col gap-3 flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by email, subject, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{ticketCategoryLabel(c)}</option>
                            ))}
                        </select>
                        <button
                            onClick={loadTickets}
                            title="Refresh tickets"
                            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                        >
                            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap bg-gray-100 rounded-xl p-1 gap-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveFilter(tab.key)}
                                className={cn(
                                    'flex-1 py-1.5 px-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap',
                                    activeFilter === tab.key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700',
                                )}
                            >
                                {tab.label} ({counts[tab.key]})
                            </button>
                        ))}
                    </div>

                    {/* Ticket List */}
                    <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <Loader2 size={28} className="mb-2 animate-spin" />
                                    <p className="text-xs font-medium">Loading tickets…</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                                    <AlertCircle size={32} className="mb-2 text-red-300" />
                                    <p className="text-xs font-bold text-gray-600">Couldn't load tickets</p>
                                    <p className="text-[11px] mt-1">{error}</p>
                                    <button onClick={loadTickets} className="mt-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg">Retry</button>
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <TicketIcon size={32} className="mb-2 opacity-30" />
                                    <p className="text-xs font-medium">No tickets found</p>
                                </div>
                            ) : (
                                filteredTickets.map((ticket) => {
                                    const tone = ticketStatusTone(ticket.status);
                                    return (
                                        <button
                                            key={ticket.id}
                                            onClick={() => selectTicket(ticket)}
                                            className={cn(
                                                'w-full p-3.5 text-left transition-all flex gap-3 border-b border-gray-100',
                                                selectedId === ticket.id
                                                    ? 'bg-yellow-50/70 border-l-[3px] border-l-yellow-400'
                                                    : 'hover:bg-gray-50 border-l-[3px] border-l-transparent',
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {initials(ticket.raised_by_email)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5 gap-2">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate">{ticket.raised_by_email}</h4>
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(ticket.updated_at)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mb-1.5">{ticket.subject || ticketCategoryLabel(ticket.category)}</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={cn('px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider', tone.bg, tone.color)}>
                                                        {ticketStatusLabel(ticket.status)}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gray-100 text-gray-400 uppercase tracking-wider">
                                                        {ticketCategoryLabel(ticket.category)}
                                                    </span>
                                                    {ticket.shared_with_partner_name && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-50 text-purple-600 uppercase tracking-wider">
                                                            <Share2 size={9} /> Shared
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* Chat Panel */}
                <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {initials(selectedTicket.raised_by_email)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{selectedTicket.raised_by_email}</h3>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{selectedTicket.raised_by_role}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {(() => {
                                                const tone = ticketStatusTone(selectedTicket.status);
                                                return (
                                                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', tone.bg, tone.color)}>
                                                        {ticketStatusLabel(selectedTicket.status)}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-gray-700">|</span>
                                            <span className="text-[10px] text-gray-400">{selectedTicket.subject || ticketCategoryLabel(selectedTicket.category)}</span>
                                            {selectedTicket.shared_with_partner_name && (
                                                <>
                                                    <span className="text-gray-700">|</span>
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-50 text-purple-600">
                                                        <Share2 size={10} /> {selectedTicket.shared_with_partner_name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className={cn(
                                        'p-2 rounded-lg transition-all flex-shrink-0',
                                        showDetails ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50',
                                    )}
                                >
                                    <Info size={16} />
                                </button>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                {/* Messages Area */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                                        {messagesLoading ? (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <Loader2 size={24} className="animate-spin" />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <MessageSquare size={40} className="mb-2 opacity-20" />
                                                <p className="text-xs font-medium">No messages in this ticket yet</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const mine = isAdminMessage(msg);
                                                const partner = isPartnerMessage(msg);
                                                const alignRight = mine;
                                                return (
                                                    <div key={msg.id} className={cn('flex gap-2.5', alignRight ? 'flex-row-reverse ml-12' : 'mr-12')}>
                                                        {!alignRight && (
                                                            <div className={cn(
                                                                'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 flex-shrink-0',
                                                                partner ? 'bg-purple-100 text-purple-700' : 'bg-gray-300 text-gray-700',
                                                            )}>
                                                                {partner ? <Building2 size={13} /> : initials(msg.sender_email)}
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            'p-3.5 rounded-2xl shadow-sm max-w-full',
                                                            mine
                                                                ? 'bg-slate-900 text-white rounded-tr-none'
                                                                : partner
                                                                    ? 'bg-purple-50 border border-purple-100 text-gray-700 rounded-tl-none'
                                                                    : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none',
                                                        )}>
                                                            {mine && (
                                                                <div className="flex items-center gap-1 mb-1.5">
                                                                    <ShieldCheck size={12} className="text-yellow-400" />
                                                                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">{msg.sender_role || 'Admin'}</span>
                                                                </div>
                                                            )}
                                                            {partner && (
                                                                <div className="flex items-center gap-1 mb-1.5">
                                                                    <Building2 size={12} className="text-purple-500" />
                                                                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Partner</span>
                                                                </div>
                                                            )}
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                                                            <span className={cn('text-[10px] mt-1.5 block', mine ? 'text-slate-400 text-right' : 'text-gray-400')}>
                                                                {formatTime(msg.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-3 bg-white border-t border-gray-200">
                                        {isResolvedOrClosed ? (
                                            <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
                                                <CheckCircle size={14} /> This ticket is {ticketStatusLabel(selectedTicket.status).toLowerCase()}.
                                                {canManage && (
                                                    <button onClick={() => changeStatus('open')} disabled={statusBusy} className="font-bold text-yellow-600 hover:text-yellow-700 disabled:opacity-50">
                                                        Reopen
                                                    </button>
                                                )}
                                            </div>
                                        ) : !canManage ? (
                                            <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
                                                <Info size={14} /> You don't have permission to reply to tickets.
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Type your reply…"
                                                        value={messageInput}
                                                        onChange={(e) => setMessageInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                        disabled={sending}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all disabled:opacity-60"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSend}
                                                    disabled={!messageInput.trim() || sending}
                                                    className={cn(
                                                        'px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 text-sm',
                                                        messageInput.trim() && !sending
                                                            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                                                    )}
                                                >
                                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Details Sidebar */}
                                {showDetails && (
                                    <div className="w-64 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
                                        <div className="p-4 border-b border-gray-200">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ticket Details</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Hash size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-gray-400 font-medium">Ticket ID</p>
                                                        <p className="text-xs font-bold text-gray-900 truncate font-mono">{selectedTicket.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Tag size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Category</p>
                                                        <p className="text-xs font-bold text-gray-900">{ticketCategoryLabel(selectedTicket.category)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <TicketIcon size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Booking Reference</p>
                                                        <p className="text-xs font-bold text-gray-900">{selectedTicket.booking_reference || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Created</p>
                                                        <p className="text-xs font-bold text-gray-900">{formatDateTime(selectedTicket.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Last Updated</p>
                                                        <p className="text-xs font-bold text-gray-900">{formatDateTime(selectedTicket.updated_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedTicket.shared_with_partner_name && (
                                            <div className="p-4 border-b border-gray-200">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Shared With Partner</h4>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <Building2 size={14} className="text-purple-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{selectedTicket.shared_with_partner_name}</p>
                                                        {selectedTicket.shared_at && (
                                                            <p className="text-[10px] text-gray-400">Shared {formatDateTime(selectedTicket.shared_at)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 border-b border-gray-200">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Raised By</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-gray-400 font-medium">Email</p>
                                                        <p className="text-xs font-bold text-gray-900 truncate">{selectedTicket.raised_by_email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <User size={14} className="text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Role</p>
                                                        <p className="text-xs font-bold text-gray-900 capitalize">{selectedTicket.raised_by_role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {canManage && (
                                            <div className="p-4">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Actions</h4>
                                                <div className="space-y-2">
                                                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                                                        <button
                                                            onClick={() => changeStatus('resolved')}
                                                            disabled={statusBusy}
                                                            className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-all disabled:opacity-60"
                                                        >
                                                            {statusBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Mark as Resolved
                                                        </button>
                                                    )}
                                                    {selectedTicket.status !== 'closed' && (
                                                        <button
                                                            onClick={() => changeStatus('closed')}
                                                            disabled={statusBusy}
                                                            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-60"
                                                        >
                                                            {statusBusy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Close Ticket
                                                        </button>
                                                    )}
                                                    {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                                                        <button
                                                            onClick={() => changeStatus('open')}
                                                            disabled={statusBusy}
                                                            className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-xl hover:bg-yellow-100 transition-all disabled:opacity-60"
                                                        >
                                                            {statusBusy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reopen Ticket
                                                        </button>
                                                    )}
                                                    {selectedTicket.raised_by_role === 'customer' && selectedTicket.status !== 'closed' && (
                                                        <button
                                                            onClick={() => setShareOpen(true)}
                                                            disabled={shareBusy}
                                                            className="w-full flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl hover:bg-purple-100 transition-all disabled:opacity-60"
                                                        >
                                                            {shareBusy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                                                            {selectedTicket.shared_with_partner_name ? 'Reassign to Partner' : 'Share with Partner'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={64} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-bold">Select a ticket to start</h3>
                            <p className="text-sm">Choose from the list on the left to view the conversation</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Share with Partner modal */}
            {shareOpen && selectedTicket && (
                <ShareWithPartnerModal
                    currentPartnerId={selectedTicket.shared_with_partner_id}
                    submitting={shareBusy}
                    onClose={() => !shareBusy && setShareOpen(false)}
                    onConfirm={handleShare}
                />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Share With Partner Modal
// ---------------------------------------------------------------------------

function ShareWithPartnerModal({
    currentPartnerId,
    submitting,
    onClose,
    onConfirm,
}: {
    currentPartnerId: string | null;
    submitting: boolean;
    onClose: () => void;
    onConfirm: (partnerId: string, note: string) => void;
}) {
    const [partners, setPartners] = useState<PartnerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [note, setNote] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await listPartners({ status: 'approved' });
                if (!cancelled) setPartners(data);
            } catch {
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const filtered = partners.filter((p) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            p.business_name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            (p.contact_person_name || '').toLowerCase().includes(q) ||
            (p.base_city || '').toLowerCase().includes(q)
        );
    });

    const canSubmit = !!selectedPartnerId && !submitting;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Share with Partner</h2>
                        <p className="text-xs text-gray-500 mt-1">The partner will join this ticket thread and can reply directly.</p>
                    </div>
                    <button onClick={onClose} disabled={submitting} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Partner search */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Select Partner <span className="text-red-400">*</span>
                        </label>
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder="Search by name, email, city..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        </div>

                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                                <Loader2 size={16} className="animate-spin" /> Loading partners...
                            </div>
                        ) : loadError ? (
                            <p className="text-xs text-red-500 py-4 text-center">Could not load partners. Please try again.</p>
                        ) : filtered.length === 0 ? (
                            <p className="text-xs text-gray-400 py-4 text-center">No partners found.</p>
                        ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-gray-200 p-1.5">
                                {filtered.map((p) => {
                                    const selected = selectedPartnerId === p.id;
                                    const isCurrent = currentPartnerId === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPartnerId(selected ? null : p.id)}
                                            className={cn(
                                                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                                                selected
                                                    ? 'bg-purple-50 border border-purple-200'
                                                    : 'hover:bg-gray-50 border border-transparent',
                                            )}
                                        >
                                            <div className={cn(
                                                'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                                                selected ? 'bg-purple-500 text-gray-900' : 'bg-gray-100 text-gray-600',
                                            )}>
                                                <Building2 size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{p.business_name}</p>
                                                    {isCurrent && (
                                                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 text-purple-600 uppercase tracking-wider flex-shrink-0">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 truncate">
                                                    {p.contact_person_name || p.email}
                                                    {p.base_city ? ` · ${p.base_city}` : ''}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                                selected ? 'border-purple-500 bg-purple-500' : 'border-gray-300',
                                            )}>
                                                {selected && <CheckCircle size={12} className="text-gray-900" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Note for Partner <span className="text-gray-700">(optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Customer says the venue AC wasn't working — can you check?"
                            disabled={submitting}
                            className="w-full h-20 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none disabled:opacity-60"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">This note is posted into the thread so the partner has context.</p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-200 flex-shrink-0">
                    <button onClick={onClose} disabled={submitting} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-60">
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedPartnerId && onConfirm(selectedPartnerId, note)}
                        disabled={!canSubmit}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? 'Sharing...' : 'Share Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SupportSystem;
