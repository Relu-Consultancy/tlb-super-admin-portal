import {
    CreditCard,
    PieChart,
    Clock,
    ArrowLeft,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import Card from '../../shared/components/ui/Card';
import StatCard from '../../shared/components/ui/StatCard';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';

// Empty until the finance API is wired.
const BOOKINGS_TREND: { name: string; value: number }[] = [];

const FinanceDashboard = () => {
    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
                    <p className="text-gray-500 text-sm">Revenue flow and payout tracking</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                        Monthly View
                    </button>
                    <button className="px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900">
                        Generate Report
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total GMV" value="$0" trend="0%" icon={CreditCard} colorClass="bg-blue-50 text-blue-600" />
                <StatCard title="Platform Revenue" value="$0" trend="0%" icon={PieChart} colorClass="bg-green-50 text-green-600" />
                <StatCard title="Pending Payouts" value="$0" trend="0%" icon={Clock} colorClass="bg-orange-50 text-orange-600" />
                <StatCard title="Refund Rate" value="0%" trend="0%" icon={ArrowLeft} colorClass="bg-red-50 text-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h3 className="font-bold text-gray-900 mb-6">Revenue Inflow vs Outflow</h3>
                    <div className="h-80">
                        {BOOKINGS_TREND.length === 0 ? (
                            <EmptyState title="No revenue data yet" description="Revenue flow will render here once the finance API is connected." className="h-full" />
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={BOOKINGS_TREND}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#FACC15" radius={[4, 4, 0, 0]} name="Inflow" />
                                <Bar dataKey="value" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Outflow" opacity={0.3} />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card className="space-y-6">
                    <h3 className="font-bold text-gray-900">Payout Status</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Verified Partners', count: 0, status: 'Ready', color: 'bg-green-500' },
                            { label: 'Pending Verification', count: 0, status: 'On Hold', color: 'bg-yellow-500' },
                            { label: 'Disputed Payments', count: 0, status: 'Review', color: 'bg-red-500' },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">{item.label}</span>
                                    <span className="text-xs text-gray-400">{item.count} partners</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                        Process All Payouts
                    </button>
                </Card>
            </div>
        </div>
    );
};

export default FinanceDashboard;
