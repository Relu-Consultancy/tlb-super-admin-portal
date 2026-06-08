import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    CheckCircle,
    CreditCard,
    Ticket,
    Calendar,
    Clock,
    Download,
    X,
    Loader2,
    AlertCircle,
    RotateCcw,
    Layers,
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
import Card from '../../shared/components/ui/Card';
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

const TYPE_COLORS = ['#FACC15', '#6366f1', '#14b8a6', '#ec4899', '#f97316', '#0ea5e9'];

function formatDateShort(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

function humanize(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const Analytics = () => {
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
            setError(err instanceof ApiError ? err.message : 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    }, [period, dateFrom, dateTo]);

    useEffect(() => {
        load();
    }, [load]);

    const currency = safeCurrency(data?.revenue?.currency);
    const money = (v: string | number | null | undefined) => formatMoney(parseAmount(v) ?? 0, currency);

    const bookingsTrend = (data?.trend ?? []).map((t) => ({ name: formatDateShort(t.date), value: t.bookings ?? 0 }));
    const byType = data?.listings?.by_type
        ? Object.entries(data.listings.by_type).map(([k, v], i) => ({ name: humanize(k), value: v, color: TYPE_COLORS[i % TYPE_COLORS.length] }))
        : [];
    const byTypeTotal = byType.reduce((s, t) => s + (t.value || 0), 0);

    const exportCsv = () => {
        if (!data) return;
        const header = ['Date', 'Bookings', 'Revenue', 'Signups'];
        const rows = data.trend.map((t) => [t.date, t.bookings, parseAmount(t.revenue) ?? 0, t.signups]);
        const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics-trend.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const bookingStatuses = data
        ? [
              { label: 'Confirmed', value: data.bookings.confirmed, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
              { label: 'Attended', value: data.bookings.attended, color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
              { label: 'Pending', value: data.bookings.pending, color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
              { label: 'Cancelled', value: data.bookings.cancelled, color: 'text-red-600', bg: 'bg-red-50', icon: X },
              { label: 'Refunded', value: data.bookings.refunded, color: 'text-gray-600', bg: 'bg-gray-100', icon: RotateCcw },
          ]
        : [];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
                    <p className="text-gray-500 text-sm">Super Admin Portal{data?.period?.label ? ` · ${data.period.label}` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {STATS_PERIODS.map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn('px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap', period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                            >
                                {STATS_PERIOD_LABELS[p]}
                            </button>
                        ))}
                    </div>
                    <button onClick={exportCsv} disabled={!data} className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 transition-all disabled:opacity-50">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </header>

            {period === 'custom' && (
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
                    <span className="text-gray-400 text-sm">→</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
                </div>
            )}

            {error ? (
                <EmptyState icon={AlertCircle} title="Couldn't load analytics" description={error} />
            ) : loading && !data ? (
                <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
            ) : !data ? (
                <EmptyState icon={Calendar} title="Pick a date range" description="Choose a period to see analytics." />
            ) : (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KpiCard icon={Ticket} label="Total Bookings" value={data.bookings.total.toLocaleString()} sub={`${data.bookings.confirmed.toLocaleString()} confirmed`} />
                        <KpiCard icon={CreditCard} label="Net Revenue" value={money(data.revenue.net)} sub={`${money(data.revenue.gross)} gross`} />
                        <KpiCard icon={Users} label="Customers" value={data.users.total_customers.toLocaleString()} sub={`+${data.users.new_customers.toLocaleString()} new · ${data.users.total_partners.toLocaleString()} partners`} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900">Daily Bookings</h3>
                                <span className="text-xs text-gray-400">{data.period?.label || 'Selected period'}</span>
                            </div>
                            <div className="h-64">
                                {bookingsTrend.length === 0 ? (
                                    <EmptyState title="No booking data yet" className="h-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={bookingsTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: '#FEF9C3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="value" fill="#FACC15" radius={[4, 4, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-6">Listings by Type</h3>
                            {byType.length === 0 ? (
                                <EmptyState icon={Layers} title="No listing data yet" className="h-64" />
                            ) : (
                                <div className="flex items-center justify-center gap-8 h-64">
                                    <div className="w-1/2 h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie data={byType} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {byType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                </Pie>
                                                <Tooltip />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-1/2 space-y-3">
                                        {byType.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900">{item.value}{byTypeTotal ? ` · ${Math.round((item.value / byTypeTotal) * 100)}%` : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Recent bookings + booking status */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4">Recent Bookings</h3>
                            {data.recent_activity.bookings.length === 0 ? (
                                <EmptyState icon={Ticket} title="No recent bookings" />
                            ) : (
                                <div className="space-y-2.5">
                                    {data.recent_activity.bookings.slice(0, 6).map((b) => (
                                        <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{b.booking_reference || b.customer_email}</p>
                                                <p className="text-xs text-gray-400 truncate capitalize">{b.customer_email} · {b.status}</p>
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 shrink-0">{money(b.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4">Booking Status</h3>
                            <div className="space-y-2.5">
                                {bookingStatuses.map((s, i) => (
                                    <div key={i} className={cn('flex items-center justify-between p-3.5 rounded-2xl', s.bg)}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn('p-2 rounded-xl bg-white', s.color)}><s.icon size={18} /></div>
                                            <span className="font-bold text-gray-900 text-sm">{s.label}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{(s.value ?? 0).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

function KpiCard({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
    return (
        <Card className="relative overflow-hidden">
            <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><Icon size={40} /></div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </Card>
    );
}

export default Analytics;
