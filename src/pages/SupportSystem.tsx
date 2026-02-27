import { useState } from 'react';
import {
    Search,
    Plus,
    MessageSquare,
    MoreVertical,
    Phone,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { cn } from '../lib/utils';
import * as mock from '../mockData';

const SupportSystem = () => {
    const [selectedChat, setSelectedChat] = useState<any>(mock.SUPPORT_CHATS[0]);

    return (
        <div className="h-[calc(100vh-160px)] flex gap-6">
            <div className="w-80 flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>

                <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Tickets</h3>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">12</span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {mock.SUPPORT_CHATS.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={cn(
                                    "w-full p-4 text-left transition-colors flex gap-3",
                                    selectedChat?.id === chat.id ? "bg-yellow-50/50" : "hover:bg-gray-50"
                                )}
                            >
                                <div className="relative flex-shrink-0">
                                    <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                    {chat.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">{chat.user}</h4>
                                        <span className="text-[10px] text-gray-400">{chat.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <img src={selectedChat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">{selectedChat.user}</h3>
                                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><Phone size={18} /></button>
                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><MoreVertical size={18} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                            <div className="flex justify-center">
                                <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Today</span>
                            </div>

                            <div className="flex gap-3 max-w-[80%]">
                                <img src={selectedChat.avatar} className="w-8 h-8 rounded-full object-cover mt-1" alt="" />
                                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        Hello, I'm having trouble with my recent booking for the "Summer Music Fest". The payment went through but I haven't received my ticket yet.
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-2 block">10:24 AM</span>
                                </div>
                            </div>

                            <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                                <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                                    <p className="text-sm leading-relaxed">
                                        Hi {selectedChat.user.split(' ')[0]}, I'm sorry to hear that. Let me check your transaction status right away. Could you please provide your booking ID?
                                    </p>
                                    <span className="text-[10px] text-slate-400 mt-2 block text-right">10:26 AM</span>
                                </div>
                            </div>

                            <div className="flex gap-3 max-w-[80%]">
                                <img src={selectedChat.avatar} className="w-8 h-8 rounded-full object-cover mt-1" alt="" />
                                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        Sure, it's #BK-98231.
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-2 block">10:27 AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex gap-3">
                                <button className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><Plus size={20} /></button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                    />
                                </div>
                                <button className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all">
                                    Send
                                </button>
                            </div>
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
    );
};

export default SupportSystem;
