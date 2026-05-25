import {
    Users,
    CheckCircle,
    CreditCard,
    Ticket,
    BarChart3,
    Calendar,
    Clock,
    FileText,
    X,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
} from 'recharts';
import { motion } from 'motion/react';
import Card from '../../shared/components/ui/Card';
import { cn } from '../../shared/lib/utils';
import * as mock from '../../data/mockData';

const Analytics = () => {
    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
                    <p className="text-gray-500 text-sm">Super Admin Portal</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                        <Calendar size={16} className="text-gray-400" /> Oct 1 - Oct 7, 2023
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900">
                        <FileText size={16} /> PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900">
                        <BarChart3 size={16} /> Excel
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><Ticket size={40} /></div>
                    <p className="text-gray-500 text-sm font-medium">Current Bookings</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-gray-900">1,248</h3>
                        <span className="text-xs font-bold text-green-500">+12.5%</span>
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><CreditCard size={40} /></div>
                    <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-gray-900">$45,200</h3>
                        <span className="text-xs font-bold text-red-500">-5.2%</span>
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><Users size={40} /></div>
                    <p className="text-gray-500 text-sm font-medium">Active Users</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-gray-900">856</h3>
                        <span className="text-xs font-bold text-green-500">+8.1%</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900">Daily Bookings</h3>
                        <span className="text-xs text-gray-400">Last 7 Days</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mock.BOOKINGS_TREND}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#FEF9C3' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#FACC15" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold text-gray-900 mb-6">Revenue by Category</h3>
                    <div className="flex items-center justify-center gap-8 h-64">
                        <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie data={mock.REVENUE_BY_CATEGORY} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {mock.REVENUE_BY_CATEGORY.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-3">
                            {mock.REVENUE_BY_CATEGORY.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-gray-900 mb-6">Top 5 Events</h3>
                    <div className="space-y-6">
                        {mock.TOP_EVENTS.map((event, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-gray-700">{event.name}</span>
                                    <span className="text-gray-900">{event.value}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${event.value}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-yellow-400 rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold text-gray-900 mb-6">Booking Status</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Confirmed', value: 842, color: 'bg-green-500', bg: 'bg-green-50', icon: CheckCircle },
                            { label: 'Pending', value: 312, color: 'bg-orange-500', bg: 'bg-orange-50', icon: Clock },
                            { label: 'Cancelled', value: 94, color: 'bg-red-500', bg: 'bg-red-50', icon: X },
                        ].map((status, i) => (
                            <div key={i} className={cn("flex items-center justify-between p-4 rounded-2xl", status.bg)}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl bg-white", status.color.replace('bg-', 'text-'))}>
                                        <status.icon size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{status.label}</span>
                                </div>
                                <span className="font-bold text-gray-900">{status.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
