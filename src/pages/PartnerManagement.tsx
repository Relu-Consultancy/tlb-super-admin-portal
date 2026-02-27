import { useState } from 'react';
import {
    Users,
    Search,
    Filter,
    FileText,
    Image as ImageIcon,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/ui/Card';
import { cn } from '../lib/utils';
import * as mock from '../mockData';

const PartnerManagement = () => {
    const [activeTab, setActiveTab] = useState('Requests');
    const [showModal, setShowModal] = useState(false);
    const [managePartner, setManagePartner] = useState<any>(null);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search partners..."
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
                        <Filter size={20} />
                    </button>
                </div>
                <div className="flex border-b border-gray-100">
                    {['Requests', 'Existing', 'Archived'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-all relative",
                                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab} {tab === 'Requests' && <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-bold">4</span>}
                            {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
                        </button>
                    ))}
                </div>
            </header>

            <div className="space-y-4">
                <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Pending Approval</p>
                {mock.PARTNERS.filter(p => p.status === 'Pending').map((partner) => (
                    <Card key={partner.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-4">
                            <img src={`https://picsum.photos/seed/${partner.id}/100/100`} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900">{partner.name}</h3>
                                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">Applied: {partner.date}</p>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Type</p>
                                        <p className="text-xs font-medium text-gray-700">{partner.type}</p>
                                    </div>
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                                        <p className="text-xs font-medium text-gray-700">{partner.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                            >
                                Review
                            </button>
                            <button
                                onClick={() => setManagePartner(partner)}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-sm"
                            >
                                Manage
                            </button>
                        </div>
                    </Card>
                ))}

                <Card className="flex items-center justify-between bg-gray-50/50 border-dashed border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-400">Venue X Space</h3>
                            <p className="text-xs text-gray-400">Applied: Oct 20, 2023</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">Rejected</span>
                    <button className="text-sm font-bold text-gray-400 hover:text-gray-600">View Reason</button>
                </Card>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-4">Documents</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { name: 'License.pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
                                            { name: 'Storefront.jpg', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
                                            { name: 'Tax_ID.docx', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' },
                                        ].map((doc, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 cursor-pointer group">
                                                <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", doc.bg, doc.color)}>
                                                    <doc.icon size={24} />
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-600">{doc.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-4">Feedback Notes</h3>
                                    <textarea
                                        placeholder="Add notes for internal review..."
                                        className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                                    Reject
                                </button>
                                <button className="flex-1 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all">
                                    Approve
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manage Modal */}
            <AnimatePresence>
                {managePartner && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setManagePartner(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Manage Partner</h2>
                                    <p className="text-xs text-gray-500 mt-1">{managePartner.name}</p>
                                </div>
                                <button onClick={() => setManagePartner(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <img src={`https://picsum.photos/seed/${managePartner.id}/100/100`} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{managePartner.name}</h3>
                                        <p className="text-xs text-gray-500">{managePartner.type} • {managePartner.location}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wider">{managePartner.status}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Commission Rate (%)</label>
                                        <input type="number" defaultValue="10" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account Manager</label>
                                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
                                            <option>Alex Rivera</option>
                                            <option>Jordan Smith</option>
                                            <option>Sarah Chen</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Internal Notes</label>
                                    <textarea
                                        placeholder="Add operational notes about this partner..."
                                        className="w-full h-24 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Suspend Account</p>
                                        <p className="text-xs text-gray-500">Temporarily restrict platform access</p>
                                    </div>
                                    <button className="w-12 h-6 bg-gray-200 rounded-full relative p-1 transition-all">
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                                <button onClick={() => setManagePartner(null)} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={() => setManagePartner(null)} className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PartnerManagement;
