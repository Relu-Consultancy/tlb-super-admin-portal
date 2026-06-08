import { useEffect, useState, useCallback } from 'react';
import {
    Wallet,
    TrendingUp,
    RotateCcw,
    Percent,
    Loader2,
    AlertCircle,
    CalendarCheck,
} from 'lucide-react';
import {
    AreaChart,
    Area,
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
import {
    getOverviewStats,
    parseAmount,
    safeCurrency,
    formatMoney,
    STATS_PERIODS,
    STATS_PERIOD_LABELS,
    ApiError,
    type OverviewStats,
    type StatsParams,
    type StatsPeriod,
} from '../../shared/lib/api';

function formatDateShort(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

const FinanceDashboard = () => {
    const [period, setPeriod] = useState<StatsPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        setLoading(true);
        setError(null);
        try {
            const params: StatsParams = period === 'custom' ? { period, date_from: dateFrom, date_to: dateTo } : { period };
            setData(await getOverviewStats(params));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load finance data.');
        } finally {
            setLoading(false);
        }
    }, [period, dateFrom, dateTo]);

    useEffect(() => { load(); }, [load]);

    const currency = safeCurrency(data?.revenue?.currency);
    const money = (v: string | number | null | undefined) => formatMoney(parseAmount(v) ?? 0, currency);
    const revenueTrend = (data?.trend ?? []).map((t) => ({ name: formatDateShort(t.date), revenue: parseAmount(t.revenue) ?? 0 }));

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
                    <p className="text-gray-500 text-sm">Revenue, fees and bookings{data?.period?.label ? ` · ${data.period.label}` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {STATS_PERIODS.map((p) => (
                            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap', period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                                {STATS_PERIOD_LABELS[p]}
                            </button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
                            <span className="text-gray-400 text-sm">→</span>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
                        </div>
                    )}
                </div>
            </header>

            {error ? (
                <EmptyState icon={AlertCircle} title="Couldn't load finance data" description={error} />
            ) : loading && !data ? (
                <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
            ) : !data ? (
                <EmptyState icon={Wallet} title="Pick a date range" description="Choose a period to see finance figures." />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Gross Revenue" value={money(data.revenue.gross)} icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
                        <StatCard title="Net Revenue" value={money(data.revenue.net)} icon={Wallet} colorClass="bg-green-50 text-green-600" />
                        <StatCard title="Refunds" value={money(data.revenue.refunds)} icon={RotateCcw} colorClass="bg-red-50 text-red-600" />
                        <StatCard title="Platform Fees" value={money(data.revenue.platform_fees)} icon={Percent} colorClass="bg-purple-50 text-purple-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900">Revenue Trend</h3>
                                <span className="text-xs text-gray-400">{data.period?.label || 'Selected period'}</span>
                            </div>
                            <div className="h-72">
                                {revenueTrend.length === 0 ? (
                                    <EmptyState title="No revenue data yet" className="h-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={70} tickFormatter={(v) => money(v)} />
                                            <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#gRev)" name="Revenue" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>

                        <Card className="space-y-4">
                            <h3 className="font-bold text-gray-900">Summary</h3>
                            <Row label="Avg Order Value" value={money(data.revenue.avg_order_value)} />
                            <Row label="Total Bookings" value={data.bookings.total.toLocaleString()} icon={CalendarCheck} />
                            <Row label="Confirmed" value={data.bookings.confirmed.toLocaleString()} />
                            <Row label="Refunded" value={data.bookings.refunded.toLocaleString()} />
                            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                                Figures from the platform stats API. Dedicated payout & refund management arrive with the Finance Phase 2 API.
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof CalendarCheck }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1.5">{Icon && <Icon size={14} className="text-gray-400" />} {label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
        </div>
    );
}

export default FinanceDashboard;
