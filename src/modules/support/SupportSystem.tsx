import { useState, useRef, useEffect } from 'react';
import {
    Search,
    Plus,
    MessageSquare,
    MoreVertical,
    Phone,
    Send,
    Zap,
    Clock,
    CheckCircle,
    AlertCircle,
    Tag,
    Mail,
    User,
    Calendar,
    ChevronDown,
    Bot,
    Headphones,
    X,
    Paperclip,
    Smile,
    Info,
    ArrowUpRight,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import { cn } from '../../shared/lib/utils';

// Empty until the support API is wired.
const SUPPORT_CHATS: any[] = [];
const SUPPORT_MESSAGES: Record<number, any[]> = {};
const SUPPORT_QUICK_REPLIES: string[] = [];

type TabFilter = 'All' | 'Active' | 'Pending' | 'Resolved';

const SupportSystem = () => {
    const [selectedChat, setSelectedChat] = useState<any>(SUPPORT_CHATS[0]);
    const [activeFilter, setActiveFilter] = useState<TabFilter>('All');
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<Record<number, any[]>>({ ...SUPPORT_MESSAGES });
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [showDetails, setShowDetails] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedChat]);

    const filteredChats = SUPPORT_CHATS.filter((chat) => {
        const matchesFilter = activeFilter === 'All' || chat.status === activeFilter;
        const matchesSearch = chat.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.ticketId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleSend = () => {
        if (!messageInput.trim() || !selectedChat) return;
        const chatMessages = messages[selectedChat.id] || [];
        const newMsg = {
            id: chatMessages.length + 1,
            sender: 'admin' as const,
            text: messageInput,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages({ ...messages, [selectedChat.id]: [...chatMessages, newMsg] });
        setMessageInput('');
        setShowQuickReplies(false);
    };

    const handleQuickReply = (text: string) => {
        setMessageInput(text);
        setShowQuickReplies(false);
    };

    const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
        Active: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Headphones },
        Pending: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
        Resolved: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    };

    const priorityConfig: Record<string, { color: string; bg: string }> = {
        High: { color: 'text-red-600', bg: 'bg-red-50' },
        Medium: { color: 'text-yellow-700', bg: 'bg-yellow-50' },
        Low: { color: 'text-gray-600', bg: 'bg-gray-100' },
    };

    const currentMessages = selectedChat ? (messages[selectedChat.id] || []) : [];

    const counts = {
        All: SUPPORT_CHATS.length,
        Active: SUPPORT_CHATS.filter(c => c.status === 'Active').length,
        Pending: SUPPORT_CHATS.filter(c => c.status === 'Pending').length,
        Resolved: SUPPORT_CHATS.filter(c => c.status === 'Resolved').length,
    };

    return (
        <div className="space-y-5">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Tickets', value: String(counts.All), trend: 'All tickets', icon: MessageSquare, color: 'text-gray-700', bg: 'bg-gray-50' },
                    { label: 'Active', value: String(counts.Active), trend: 'Being handled', icon: Headphones, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Pending', value: String(counts.Pending), trend: 'Awaiting agent', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Resolved', value: String(counts.Resolved), trend: 'Closed today', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <Card key={i} className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setActiveFilter(stat.label as TabFilter)}>
                        <div className={cn('p-3 rounded-xl', stat.bg)}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Layout */}
            <div className="h-[calc(100vh-300px)] flex gap-4">
                {/* Ticket List Panel */}
                <div className="w-80 flex flex-col gap-3 flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name or ticket ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        {(['All', 'Active', 'Pending', 'Resolved'] as TabFilter[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={cn(
                                    'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all',
                                    activeFilter === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                {tab} ({counts[tab]})
                            </button>
                        ))}
                    </div>

                    {/* Ticket List */}
                    <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            {filteredChats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <Search size={32} className="mb-2 opacity-30" />
                                    <p className="text-xs font-medium">No tickets found</p>
                                </div>
                            ) : (
                                filteredChats.map((chat) => {
                                    const statusCfg = statusConfig[chat.status] || statusConfig.Active;
                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => setSelectedChat(chat)}
                                            className={cn(
                                                'w-full p-3.5 text-left transition-all flex gap-3 border-b border-gray-50',
                                                selectedChat?.id === chat.id
                                                    ? 'bg-yellow-50/70 border-l-[3px] border-l-yellow-400'
                                                    : 'hover:bg-gray-50/70 border-l-[3px] border-l-transparent'
                                            )}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                {chat.unread && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate">{chat.user}</h4>
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{chat.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mb-1.5">{chat.lastMessage}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn('px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider', statusCfg.bg, statusCfg.color)}>
                                                        {chat.status}
                                                    </span>
                                                    <span className={cn('px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider', priorityConfig[chat.priority]?.bg, priorityConfig[chat.priority]?.color)}>
                                                        {chat.priority}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gray-100 text-gray-500 uppercase tracking-wider">
                                                        {chat.category}
                                                    </span>
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
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={selectedChat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        <div className={cn(
                                            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                                            selectedChat.status === 'Active' ? 'bg-green-500' :
                                            selectedChat.status === 'Pending' ? 'bg-orange-400' : 'bg-gray-400'
                                        )} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-gray-900">{selectedChat.user}</h3>
                                            <span className="text-[10px] font-mono text-gray-400">{selectedChat.ticketId}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {(() => {
                                                const cfg = statusConfig[selectedChat.status];
                                                return (
                                                    <span className={cn('flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider', cfg?.color)}>
                                                        <cfg.icon size={10} /> {selectedChat.status}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-gray-300">|</span>
                                            <span className="text-[10px] text-gray-400">{selectedChat.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><Phone size={16} /></button>
                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        className={cn(
                                            'p-2 rounded-lg transition-all',
                                            showDetails ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                        )}
                                    >
                                        <Info size={16} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><MoreVertical size={16} /></button>
                                </div>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                {/* Messages Area */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                                        <div className="flex justify-center">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Today</span>
                                        </div>

                                        {currentMessages.map((msg) => (
                                            <div key={msg.id} className={cn(
                                                'flex gap-2.5',
                                                msg.sender === 'admin' ? 'flex-row-reverse' : '',
                                                msg.sender === 'admin' ? 'ml-12' : 'mr-12'
                                            )}>
                                                {msg.sender !== 'admin' && (
                                                    <img src={selectedChat.avatar} className="w-7 h-7 rounded-full object-cover mt-1 flex-shrink-0" alt="" />
                                                )}
                                                <div className={cn(
                                                    'p-3.5 rounded-2xl shadow-sm max-w-full',
                                                    msg.sender === 'admin'
                                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                                        : msg.sender === 'bot'
                                                        ? 'bg-blue-50 border border-blue-100 text-gray-700 rounded-tl-none'
                                                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                                                )}>
                                                    {msg.sender === 'bot' && (
                                                        <div className="flex items-center gap-1 mb-1.5">
                                                            <Bot size={12} className="text-blue-500" />
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">TLB Bot</span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                                    <span className={cn(
                                                        'text-[10px] mt-1.5 block',
                                                        msg.sender === 'admin' ? 'text-slate-400 text-right' : 'text-gray-400'
                                                    )}>{msg.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Quick Replies */}
                                    {showQuickReplies && (
                                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Replies</span>
                                                <button onClick={() => setShowQuickReplies(false)} className="p-1 hover:bg-gray-100 rounded-md">
                                                    <X size={12} className="text-gray-400" />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {SUPPORT_QUICK_REPLIES.map((reply, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleQuickReply(reply)}
                                                        className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-full hover:bg-yellow-50 hover:border-yellow-200 transition-all"
                                                    >
                                                        {reply}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Message Input */}
                                    <div className="p-3 bg-white border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                                                <Paperclip size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowQuickReplies(!showQuickReplies)}
                                                className={cn(
                                                    'p-2 rounded-lg transition-all',
                                                    showQuickReplies ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                                )}
                                            >
                                                <Zap size={18} />
                                            </button>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Type your message..."
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                                />
                                            </div>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                                                <Smile size={18} />
                                            </button>
                                            <button
                                                onClick={handleSend}
                                                disabled={!messageInput.trim()}
                                                className={cn(
                                                    'px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 text-sm',
                                                    messageInput.trim()
                                                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 shadow-md shadow-yellow-400/20'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                )}
                                            >
                                                <Send size={16} /> Send
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Sidebar */}
                                {showDetails && (
                                    <div className="w-64 border-l border-gray-100 bg-white overflow-y-auto flex-shrink-0">
                                        <div className="p-4 border-b border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ticket Details</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Tag size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Ticket ID</p>
                                                        <p className="text-xs font-bold text-gray-900">{selectedChat.ticketId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <AlertCircle size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Priority</p>
                                                        <span className={cn('text-xs font-bold', priorityConfig[selectedChat.priority]?.color)}>
                                                            {selectedChat.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Created</p>
                                                        <p className="text-xs font-bold text-gray-900">{selectedChat.createdAt}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Headphones size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Handled By</p>
                                                        <p className="text-xs font-bold text-gray-900">
                                                            {selectedChat.type === 'BOT' ? 'TLB Bot' : selectedChat.type === 'PENDING' ? 'Unassigned' : 'Admin Agent'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 border-b border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Info</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2.5">
                                                    <User size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Name</p>
                                                        <p className="text-xs font-bold text-gray-900">{selectedChat.user}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Email</p>
                                                        <p className="text-xs font-bold text-gray-900">{selectedChat.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Phone</p>
                                                        <p className="text-xs font-bold text-gray-900">{selectedChat.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Actions</h4>
                                            <div className="space-y-2">
                                                {selectedChat.status !== 'Resolved' && (
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-all">
                                                        <CheckCircle size={14} /> Mark as Resolved
                                                    </button>
                                                )}
                                                {selectedChat.type === 'BOT' && (
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all">
                                                        <Headphones size={14} /> Take Over from Bot
                                                    </button>
                                                )}
                                                <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-xl hover:bg-yellow-100 transition-all">
                                                    <ArrowUpRight size={14} /> Escalate Ticket
                                                </button>
                                                <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all">
                                                    <User size={14} /> View User Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={64} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-bold">Select a ticket to start</h3>
                            <p className="text-sm">Choose from the list on the left to view conversation</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default SupportSystem;
