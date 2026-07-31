import { Search, Filter, Download, History } from 'lucide-react';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { USER_SECTION_USERS as users } from '../../mockData';

interface UserDirectoryGridProps {
    onOpenHistory: (user: any) => void;
}

const UserDirectoryGrid = ({ onOpenHistory }: UserDirectoryGridProps) => {
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">ZONE 2: Master User Directory & Interactive Drill-Down</h2>
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
                <div className="relative flex-1 min-w-[250px]">
                    <input
                        type="text"
                        placeholder="Type Name, User ID, Email, or Contact Number..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400" size={18} />
                    <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none font-medium text-gray-700">
                        <option>All Revenue</option>
                        <option>High Value (&gt; ₹110k)</option>
                        <option>Mid Value</option>
                        <option>Zero Billing</option>
                    </select>
                </div>
                
                <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none font-medium text-gray-700">
                    <option>All Accounts</option>
                    <option>Active</option>
                    <option>Suspended</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors ml-auto text-sm">
                    <Download size={16} /> Export CSV Ledger
                </button>
            </div>

            {/* Data Grid */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sr No</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User ID & Profile</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Details</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Billing (User)</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">TLB Ticket Comm.</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">TLB Enquiry Rev.</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total TLB Rev.</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user, idx) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                                    <td className="px-4 py-4">
                                        <p className="text-xs font-bold text-yellow-600 mb-0.5">{user.id}</p>
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">Created: {user.created}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm text-gray-700">{user.email}</p>
                                        <p className="text-xs text-gray-500">{user.phone}</p>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-900">₹{user.totalBilling.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-green-600">₹{user.tlbCommissions.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-blue-600">₹{user.enquiryRevenue.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-purple-600">₹{user.tlbTotalRevenue.toLocaleString()}</td>
                                    <td className="px-4 py-4">
                                        <button 
                                            onClick={() => onOpenHistory(user)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-lg hover:bg-yellow-100 transition-colors"
                                        >
                                            <History size={14} /> Open History
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </section>
    );
};

export default UserDirectoryGrid;
