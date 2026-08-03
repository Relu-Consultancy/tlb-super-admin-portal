import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt, Star, Heart, ShieldAlert, FileText, CheckCircle, AlertTriangle, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { USER_TRANSACTIONS, USER_REVIEWS, USER_LIKED_LISTINGS, USER_FOLLOWED_PARTNERS } from '../../mockData';

interface UserHistorySlideOutProps {
    user: any;
    onClose: () => void;
}

const UserHistorySlideOut = ({ user, onClose }: UserHistorySlideOutProps) => {
    const [activeTab, setActiveTab] = useState('bookings');

    const tabs = [
        { id: 'bookings', label: 'Bookings & Enquiries', icon: Receipt },
        { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
        { id: 'loyalty', label: 'Followed Partners', icon: Heart },
        { id: 'security', label: 'Security & Controls', icon: ShieldAlert },
    ];

    return (
        <AnimatePresence>
            {user && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-4xl bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200"
                    >
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Activity Ledger: {user.name}</h2>
                                <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest">{user.id}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white px-6 border-b border-gray-100 flex gap-6 overflow-x-auto">
                            {tabs.map((tab) => (
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

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            
                            {/* Tab 1: Bookings & Enquiries Ledger */}
                            {activeTab === 'bookings' && (
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ref ID & Date</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listing Details</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pricing</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">TLB Net</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {USER_TRANSACTIONS.map((txn, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <p className="text-xs font-bold text-gray-900">{txn.refId}</p>
                                                            <p className="text-[10px] text-gray-500">{txn.date}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-gray-900">{txn.item}</p>
                                                            <p className="text-[10px] text-gray-500">{txn.partner} • {txn.category}</p>
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded uppercase">{txn.interaction}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn(
                                                                "px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                                                                txn.status.includes('Issued') ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                                            )}>{txn.status}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-xs text-gray-500">Base: ₹{txn.originalPrice} x {txn.qty}</p>
                                                            <p className="text-[10px] font-medium text-red-500">{txn.discount}</p>
                                                            <p className="text-sm font-bold text-gray-900 mt-0.5">Paid: ₹{txn.paidValue}</p>
                                                            {txn.discountType && <p className="text-[9px] text-gray-400 mt-0.5">{txn.discountType}</p>}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-green-600">₹{txn.tlbEarnings}</td>
                                                        <td className="px-4 py-3">
                                                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors">
                                                                <FileText size={14} /> {txn.interaction === 'Lead Generated' ? 'View Details' : 'View Invoice'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: User Reviews & Ratings */}
                            {activeTab === 'reviews' && (
                                <div className="space-y-4">
                                    {USER_REVIEWS.map((rev, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 mb-1">{rev.id} • {rev.date}</p>
                                                    <h3 className="text-sm font-bold text-gray-900">{rev.item}</h3>
                                                    <p className="text-xs text-gray-500">{rev.partner} • {rev.category}</p>
                                                </div>
                                                <span className={cn(
                                                    "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                                                    rev.status.includes('Live') ? "bg-green-50 text-green-600" :
                                                    rev.status.includes('Disputed') ? "bg-red-50 text-red-600" : "bg-yellow-100 text-yellow-700"
                                                )}>{rev.status}</span>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <div className="flex gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-gray-700 italic">"{rev.preview}"</p>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                                                <button className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg">View Full Text</button>
                                                <button className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">
                                                    <EyeOff size={14} /> Hide Review
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tab 3: Brand Loyalty Tracker */}
                            {activeTab === 'loyalty' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-3">Sub-Table A: Saved, Liked & Shared Listings</h3>
                                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                            <table className="w-full text-left whitespace-nowrap">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-100">
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listing</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interactions</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Action</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {USER_LIKED_LISTINGS.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-bold text-gray-400">{item.id}</p>
                                                                <p className="text-sm font-bold text-gray-900">{item.item}</p>
                                                                <p className="text-xs text-gray-500">{item.partner}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-bold text-gray-500">Liked: <span className={item.liked ? "text-green-600" : ""}>{item.liked ? 'Yes' : 'No'}</span></span>
                                                                    <span className="text-[10px] font-bold text-gray-500">Bookmark: <span className={item.saved === 'Saved' ? "text-blue-600" : ""}>{item.saved}</span></span>
                                                                    <span className="text-[10px] font-bold text-gray-500">Share: {item.shared}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-medium text-gray-600">{item.lastInteraction}</td>
                                                            <td className="px-4 py-3">
                                                                <button className="text-xs font-bold text-blue-600 hover:text-blue-800">View Listing</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-3">Sub-Table B: Followed Partner Brands</h3>
                                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                            <table className="w-full text-left whitespace-nowrap">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-100">
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Follow Info</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notifications</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {USER_FOLLOWED_PARTNERS.map((ptr, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-bold text-gray-400">{ptr.id}</p>
                                                                <p className="text-sm font-bold text-gray-900">{ptr.name}</p>
                                                                <p className="text-xs text-gray-500">{ptr.category}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-medium text-gray-700">Since {ptr.date}</p>
                                                                <p className="text-[10px] font-bold text-green-600 mt-0.5">{ptr.liveListings}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded uppercase">{ptr.notification}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Partner Profile</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Security & Controls */}
                            {activeTab === 'security' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Login ID</h4>
                                            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                                            <p className="text-[10px] font-bold text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12}/> Verified System Account</p>
                                        </div>
                                        <button className="px-4 py-2 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-100">Update Email</button>
                                    </div>
                                    
                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Account Password State</h4>
                                            <p className="text-xs text-gray-500 mt-1 font-mono tracking-widest">•••••••••••• (Encrypted)</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-1">Last Changed: 12-Apr-2026</p>
                                        </div>
                                        <button className="px-4 py-2 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-100">Trigger Reset Link</button>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Device Sessions</h4>
                                            <p className="text-xs text-gray-500 mt-1">2 Devices Active (iOS App + Mobile Web)</p>
                                            <p className="text-[10px] font-medium text-green-600 mt-1">Clean Session Logs</p>
                                        </div>
                                        <button className="px-4 py-2 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100">Force Log Out All</button>
                                    </div>

                                    <div className="bg-red-50 rounded-2xl border border-red-100 p-5 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-red-900">Account Compliance Status</h4>
                                            <p className="text-xs text-red-700 mt-1">0 Flags / 0 Violations Recorded</p>
                                            <p className="text-[10px] font-bold text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12}/> Fully Active</p>
                                        </div>
                                        <button className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 flex items-center gap-2">
                                            <AlertTriangle size={14}/> Suspend Account
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserHistorySlideOut;
