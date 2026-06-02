import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt, Star, Heart, ShieldAlert } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import EmptyState from '../../../shared/components/ui/EmptyState';
import type { Customer } from '../../../shared/lib/api';

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

interface UserHistorySlideOutProps {
    user: Customer | null;
    onClose: () => void;
}

const UserHistorySlideOut = ({ user, onClose }: UserHistorySlideOutProps) => {
    const [activeTab, setActiveTab] = useState('account');

    const tabs = [
        { id: 'account', label: 'Account & Security', icon: ShieldAlert },
        { id: 'bookings', label: 'Bookings & Enquiries', icon: Receipt },
        { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
        { id: 'loyalty', label: 'Followed Partners', icon: Heart },
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
                        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200"
                    >
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-gray-900 truncate">Activity Ledger: {user.email}</h2>
                                <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest truncate">{user.id}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors shrink-0">
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
                            {/* Account & Security — real customer account fields */}
                            {activeTab === 'account' && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Email', value: user.email },
                                        { label: 'User ID', value: user.id },
                                        { label: 'Role', value: user.role },
                                        { label: 'Auth Provider', value: user.auth_provider },
                                        { label: 'Verified', value: user.is_verified ? 'Yes' : 'No' },
                                        { label: 'Account Status', value: user.is_active ? 'Active' : 'Disabled' },
                                        { label: 'Disabled Reason', value: user.disabled_reason || '—' },
                                        { label: 'Disabled At', value: formatDateTime(user.disabled_at) },
                                        { label: 'Last Login', value: formatDateTime(user.last_login) },
                                        { label: 'Created', value: formatDateTime(user.created_at) },
                                    ].map((row) => (
                                        <div key={row.label} className="flex flex-col gap-0.5 pb-3 border-b border-gray-50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                                            <span className="text-sm text-gray-800 break-all">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* The rich-history tabs have no backing endpoint yet. */}
                            {activeTab === 'bookings' && (
                                <div className="bg-white rounded-2xl border border-gray-100">
                                    <EmptyState icon={Receipt} title="Not available yet" description="Booking & enquiry history needs a dedicated endpoint that the API doesn't expose." />
                                </div>
                            )}
                            {activeTab === 'reviews' && (
                                <div className="bg-white rounded-2xl border border-gray-100">
                                    <EmptyState icon={Star} title="Not available yet" description="Customer reviews & ratings need a dedicated endpoint." />
                                </div>
                            )}
                            {activeTab === 'loyalty' && (
                                <div className="bg-white rounded-2xl border border-gray-100">
                                    <EmptyState icon={Heart} title="Not available yet" description="Saved listings & followed partners need a dedicated endpoint." />
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
