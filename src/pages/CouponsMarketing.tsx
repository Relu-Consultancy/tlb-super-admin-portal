import { useState } from 'react';
import {
    Users,
    Ticket,
    Plus,
    X,
    Settings as SettingsIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/ui/Card';
import * as mock from '../mockData';

const CouponsMarketing = () => {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coupons & Marketing</h1>
                    <p className="text-gray-500 text-sm">Manage discounts and promotional campaigns</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all"
                >
                    <Plus size={18} /> Create Coupon
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Coupons</h3>
                        <div className="flex gap-2">
                            <button className="text-xs font-bold text-yellow-600">All</button>
                            <button className="text-xs font-bold text-gray-400">Expired</button>
                        </div>
                    </div>
                    {mock.COUPONS.map((coupon) => (
                        <Card key={coupon.id} className="flex items-center justify-between p-5 group">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-2xl flex items-center justify-center">
                                    <span className="text-xl font-black text-yellow-600">{coupon.discount}%</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-mono font-bold text-gray-900 tracking-wider uppercase">{coupon.code}</h4>
                                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Valid until: {coupon.expiry}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                                            <Users size={12} /> {coupon.usageCount} Uses
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                                            <Ticket size={12} /> {coupon.limit} Limit
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg"><SettingsIcon size={18} /></button>
                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X size={18} /></button>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-0">
                        <h3 className="font-bold text-sm mb-4">Marketing Tips</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            "SUMMER24" is your best performing coupon this month. Consider extending its duration for another 2 weeks.
                        </p>
                        <button className="w-full py-2.5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-xl">
                            Apply Suggestion
                        </button>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500">Total Discount Given</span>
                                    <span className="font-bold text-gray-900">$12,450</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: '65%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500">Conversion Rate</span>
                                    <span className="font-bold text-gray-900">4.2%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full" style={{ width: '42%' }} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreate(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
                                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Coupon Code</label>
                                        <input type="text" placeholder="e.g. SAVE20" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Discount %</label>
                                        <input type="number" placeholder="20" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expiry Date</label>
                                    <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usage Limit</label>
                                    <input type="number" placeholder="500" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Apply To</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
                                        <option>All Events</option>
                                        <option>Specific Partner</option>
                                        <option>Category: Music</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50">
                                <button className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">
                                    Generate Coupon
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CouponsMarketing;
