import { Search, Filter, Download, History } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';
import { cn } from '../../../shared/lib/utils';
import { USER_SECTION_USERS as users } from '../../../data/mockData';

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
                <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
                    <option>All Revenue Tiers</option>
                    <option>High Value (&gt;₹50k)</option>
                    <option>Mid Value (₹10k-₹50k)</option>
                    <option>Low Value (&lt;₹10k)</option>
                </select>
                <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none cursor-pointer">
                    <option>All Account Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Suspended</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                    <Filter size={16} /> More Filters
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:bg-yellow-500 transition-colors ml-auto">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* User Table */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Details</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact & Location</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Summary</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform Activity</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Status</th>
                                <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-yellow-50/30 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-gray-100" alt="" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{user.id}</p>
                                                <p className="text-[10px] text-gray-500">Since {user.joinDate}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-xs text-gray-700">{user.email}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{user.location}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-gray-900">₹{user.totalRevenue.toLocaleString()}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{user.revenueBreakdown.tickets}% Tkts</span>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{user.revenueBreakdown.inquiries}% Inq</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-xs text-gray-700">{user.totalBookings} Bookings</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{user.totalInquiries} Inquiries</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Last: {user.lastActive}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                                            user.accountStatus === 'Active' ? "bg-green-50 text-green-600" :
                                            user.accountStatus === 'Inactive' ? "bg-gray-100 text-gray-500" :
                                            "bg-red-50 text-red-600"
                                        )}>{user.accountStatus}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => onOpenHistory(user)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-yellow-400 hover:text-gray-900 transition-all"
                                        >
                                            <History size={14} /> View History
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
