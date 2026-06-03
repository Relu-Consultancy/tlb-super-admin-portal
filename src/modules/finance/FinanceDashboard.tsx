import { useEffect, useState } from 'react';
import {
    CreditCard,
    Clock,
    Users,
    BadgeCheck,
    Info,
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
import { getPartnerMetrics, getUserMetrics, type PartnerMetrics, type UserMetrics } from '../../shared/lib/api';

// Revenue trend stays empty until a finance/transactions aggregate API exists.
const BOOKINGS_TREND: { name: string; value: number }[] = [];

const FinanceDashboard = () => {
    const [pm, setPm] = useState<PartnerMetrics | null>(null);
    const [um, setUm] = useState<UserMetrics | null>(null);

    useEffect(() => {
        getPartnerMetrics().then(setPm).catch(() => {});
        getUserMetrics().then(setUm).catch(() => {});
    }, []);

    const n = (v: number | undefined) => (v === undefined ? '—' : v.toLocaleString());

    const payoutRows = [
        { label: 'Verified Partners', count: pm?.is_verified_count, status: 'Ready', color: 'bg-green-500' },
        { label: 'Pending Verification', count: pm?.under_review, status: 'On Hold', color: 'bg-yellow-500' },
        { label: 'Rejected Partners', count: pm?.rejected, status: 'Review', color: 'bg-red-500' },
    ];

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

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl px-4 py-3">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>Revenue, GMV and payout amounts need a dedicated finance API that isn't available yet. Showing partner payout-readiness and user counts from existing data in the meantime.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Partners" value={n(pm?.total_partners)} icon={CreditCard} colorClass="bg-blue-50 text-blue-600" />
                <StatCard title="Payout-Ready Partners" value={n(pm?.is_verified_count)} icon={BadgeCheck} colorClass="bg-green-50 text-green-600" />
                <StatCard title="Pending Verification" value={n(pm?.under_review)} icon={Clock} colorClass="bg-orange-50 text-orange-600" />
                <StatCard title="Total Users" value={n(um?.total_users)} icon={Users} colorClass="bg-purple-50 text-purple-600" />
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
                        {payoutRows.map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">{item.label}</span>
                                    <span className="text-xs text-gray-400">{n(item.count)} partners</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        disabled
                        title="Payout processing needs the finance API"
                        className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed"
                    >
                        Process All Payouts
                    </button>
                </Card>
            </div>
        </div>
    );
};

export default FinanceDashboard;
