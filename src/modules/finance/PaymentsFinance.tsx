import { useState } from 'react';
import {
    Search,
    Plus,
    Download,
    Filter,
    MoreVertical,
    FileText,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';

interface Transaction {
    id: string;
    user: string;
    partner: string;
    amount: number;
    status: string;
    date: string;
}

// Empty until the transactions API is wired.
const TRANSACTIONS: Transaction[] = [];

const PaymentsFinance = () => {
    const [activeTab, setActiveTab] = useState('Transactions');
    const [showRegister, setShowRegister] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>
                <div className="flex border-b border-gray-100">
                    {['Transactions', 'Payouts', 'Refunds'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium transition-all relative",
                                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && <motion.div layoutId="payTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search by Transaction ID or User..."
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <div className="flex gap-2">
                    {activeTab === 'Transactions' && (
                        <button
                            onClick={() => setShowRegister(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-sm transition-all"
                        >
                            <Plus size={16} /> Register
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Filter size={16} /> Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User / Partner</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {TRANSACTIONS.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            icon={FileText}
                                            title="No transactions yet"
                                            description="Transactions will appear here once the payments API is connected."
                                        />
                                    </td>
                                </tr>
                            )}
                            {TRANSACTIONS.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-900">{tx.user}</p>
                                        <p className="text-[10px] text-gray-400">{tx.partner}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-900">₹{tx.amount.toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400">Fee: ₹2.50</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                                            tx.status === 'Completed' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{tx.date}</td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Showing 0 of 0 transactions</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-400 disabled:opacity-50" disabled>Prev</button>
                        <button className="px-3 py-1 bg-yellow-400 rounded-lg text-xs font-bold text-gray-900">1</button>
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600">2</button>
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600">Next</button>
                    </div>
                </div>
            </Card>

            <AnimatePresence>
                {showRegister && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegister(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Register Transaction</h2>
                                <button onClick={() => setShowRegister(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction ID</label>
                                        <input type="text" placeholder="e.g. TXN-12345" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount</label>
                                        <input type="number" placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name</label>
                                    <input type="text" placeholder="e.g. John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                                        <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
                                            <option>Completed</option>
                                            <option>Pending</option>
                                            <option>Failed</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Attach Document</label>
                                    <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-yellow-400 transition-colors cursor-pointer">
                                        <FileText size={24} className="mb-2" />
                                        <span className="text-sm font-medium">Click to upload document</span>
                                        <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowRegister(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                                <button onClick={() => setShowRegister(false)} className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">Register</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showFilters && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Filter Transactions</h2>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['All', 'Completed', 'Pending', 'Failed'].map((status) => (
                                            <button key={status} className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all border", status === 'All' ? "bg-yellow-400 border-yellow-400 text-gray-900 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}>{status}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Amount Range</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                            <input type="number" placeholder="Min" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                        </div>
                                        <span className="text-gray-400 font-bold">-</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                            <input type="number" placeholder="Max" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Date Timeline</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
                                        <option>Any Time</option>
                                        <option>Today</option>
                                        <option>Last 7 Days</option>
                                        <option>Last 30 Days</option>
                                        <option>This Month</option>
                                        <option>Custom Range</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-between items-center gap-4 border-t border-gray-100">
                                <button className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Reset Filters</button>
                                <button onClick={() => setShowFilters(false)} className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all flex-1 text-center">Apply</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentsFinance;
