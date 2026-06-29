import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    Users,
    Store,
    Layers,
    CalendarCheck,
    Wallet,
    LifeBuoy,
    CheckCircle,
    Calendar,
    UserCog,
    MessageSquare,
    ChevronRight,
    Loader2,
    AlertCircle,
    TrendingUp,
    Megaphone,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { Screen } from '../../types';
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

function humanize(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const Dashboard = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
    const [period, setPeriod] = useState<StatsPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        // For a custom range, wait until both ends are picked.
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        setLoading(true);
        setError(null);
        try {
            const params: StatsParams = period === 'custom'
                ? { period, date_from: dateFrom, date_to: dateTo }
                : { period };
            setData(await getOverviewStats(params));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    }, [period, dateFrom, dateTo]);

    useEffect(() => {
        load();
    }, [load]);

    const currency = safeCurrency(data?.revenue?.currency);
    const money = (v: string | number | null | undefined) => formatMoney(parseAmount(v) ?? 0, currency);

    const trend = (data?.trend ?? []).map((t) => ({
        date: formatDateShort(t.date),
        bookings: t.bookings ?? 0,
        signups: t.signups ?? 0,
        revenue: parseAmount(t.revenue) ?? 0,
    }));

    const QUICK_ACTIONS = [
        { label: 'Approve Partners', sub: 'Review pending partners', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', screen: Screen.PARTNER_MANAGEMENT },
        { label: 'Approve Listings', sub: 'Moderate event/venue/class listings', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', screen: Screen.EVENT_APPROVAL },
        { label: 'Open Tickets', sub: 'Respond to support tickets', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', screen: Screen.SUPPORT_SYSTEM },
        { label: 'Send a Broadcast', sub: 'Notify users & partners', icon: Megaphone, color: 'text-amber-500', bg: 'bg-amber-50', screen: Screen.BROADCASTS },
        { label: 'Team Management', sub: 'Add or edit admins', icon: UserCog, color: 'text-orange-500', bg: 'bg-orange-50', screen: Screen.ADMIN_MANAGEMENT },
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-gray-500 text-sm">Platform analytics{data?.period?.label ? ` · ${data.period.label}` : ''}</p>
                    <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {STATS_PERIODS.map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap',
                                    period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                                )}
                            >
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
                <EmptyState icon={AlertCircle} title="Couldn't load statistics" description={error} />
            ) : loading && !data ? (
                <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
            ) : !data ? (
                <EmptyState icon={TrendingUp} title="Pick a date range" description="Choose a period to see platform statistics." />
            ) : (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <Kpi icon={Users} tone="bg-blue-50 text-blue-600" label="Customers" value={data.users.total_customers} sub={`+${data.users.new_customers} new`} />
                        <Kpi icon={Store} tone="bg-purple-50 text-purple-600" label="Partners" value={data.users.total_partners} sub={`+${data.users.new_partners} new`} />
                        <Kpi icon={Layers} tone="bg-teal-50 text-teal-600" label="Listings" value={data.listings.total} sub={`${data.listings.pending_moderation} pending`} />
                        <Kpi icon={CalendarCheck} tone="bg-indigo-50 text-indigo-600" label="Bookings" value={data.bookings.total} sub={`${data.bookings.confirmed} confirmed`} />
                        <Kpi icon={Wallet} tone="bg-green-50 text-green-600" label="Net Revenue" valueText={money(data.revenue.net)} sub={`${money(data.revenue.gross)} gross`} />
                        <Kpi icon={LifeBuoy} tone="bg-orange-50 text-orange-600" label="Open Tickets" value={data.support.total_open} sub={`${data.support.in_progress} in progress`} />
                    </div>

                    {/* Trend + breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Activity Trend</h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Bookings</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Signups</span>
                                </div>
                            </div>
                            {trend.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-sm text-gray-400">No trend data for this period.</div>
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gBookings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 12 }} />
                                            <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} fill="url(#gBookings)" />
                                            <Area type="monotone" dataKey="signups" stroke="#60a5fa" strokeWidth={2} fill="url(#gSignups)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </Card>

                        {/* Revenue breakdown */}
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4">Revenue</h3>
                            <div className="space-y-3">
                                <Line label="Gross" value={money(data.revenue.gross)} />
                                <Line label="Refunds" value={money(data.revenue.refunds)} tone="text-red-600" />
                                <Line label="Platform Fees" value={money(data.revenue.platform_fees)} />
                                <Line label="Avg Order Value" value={money(data.revenue.avg_order_value)} />
                                <div className="pt-3 border-t border-gray-100">
                                    <Line label="Net" value={money(data.revenue.net)} bold tone="text-green-600" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Listings + Bookings + Support breakdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Breakdown title="Listings" rows={[
                            ['Published', data.listings.published],
                            ['Pending', data.listings.pending_moderation],
                            ['Draft', data.listings.draft],
                            ['Rejected', data.listings.rejected],
                        ]} extra={data.listings.by_type} />
                        <Breakdown title="Bookings" rows={[
                            ['Confirmed', data.bookings.confirmed],
                            ['Attended', data.bookings.attended],
                            ['Pending', data.bookings.pending],
                            ['Cancelled', data.bookings.cancelled],
                            ['Refunded', data.bookings.refunded],
                        ]} />
                        <Breakdown title="Support" rows={[
                            ['Open', data.support.open],
                            ['In Progress', data.support.in_progress],
                            ['Resolved (period)', data.support.resolved_in_period],
                            ['Total Open', data.support.total_open],
                        ]} />
                    </div>

                    {/* Recent activity + quick actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <ActivityList title="Bookings" empty="No recent bookings">
                                    {data.recent_activity.bookings.slice(0, 5).map((b) => (
                                        <ActivityRow key={b.id} primary={b.booking_reference || b.customer_email} secondary={`${money(b.amount)} · ${b.status}`} time={formatDateShort(b.created_at)} />
                                    ))}
                                </ActivityList>
                                <ActivityList title="Signups" empty="No recent signups">
                                    {data.recent_activity.signups.slice(0, 5).map((s) => (
                                        <ActivityRow key={s.id} primary={s.email} secondary={`${s.role}${s.auth_provider ? ` · ${s.auth_provider}` : ''}`} time={formatDateShort(s.created_at)} />
                                    ))}
                                </ActivityList>
                                <ActivityList title="Tickets" empty="No recent tickets">
                                    {data.recent_activity.tickets.slice(0, 5).map((t) => (
                                        <ActivityRow key={t.id} primary={t.subject || humanize(t.category)} secondary={`${t.status}${t.raised_by_role ? ` · ${t.raised_by_role}` : ''}`} time={formatDateShort(t.created_at)} />
                                    ))}
                                </ActivityList>
                            </div>
                        </Card>

                        <Card className="flex flex-col">
                            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2.5 flex-1">
                                {QUICK_ACTIONS.map((a) => (
                                    <button key={a.label} onClick={() => setScreen(a.screen)} className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('p-2 rounded-xl', a.bg, a.color)}><a.icon size={18} /></div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 text-sm">{a.label}</p>
                                                <p className="text-xs text-gray-500">{a.sub}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function Kpi({ icon: Icon, tone, label, value, valueText, sub }: { icon: typeof Users; tone: string; label: string; value?: number; valueText?: string; sub?: string }) {
    return (
        <Card className="flex flex-col gap-2">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tone)}><Icon size={20} /></div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{valueText ?? (value ?? 0).toLocaleString()}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            </div>
            {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
        </Card>
    );
}

function Line({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={cn(bold ? 'font-bold text-base' : 'font-medium', tone ?? 'text-gray-800')}>{value}</span>
        </div>
    );
}

function Breakdown({ title, rows, extra }: { title: string; rows: [string, number][]; extra?: Record<string, number> }) {
    const extraEntries = extra ? Object.entries(extra) : [];
    return (
        <Card>
            <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
            <div className="space-y-2">
                {rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-bold text-gray-800">{(v ?? 0).toLocaleString()}</span>
                    </div>
                ))}
            </div>
            {extraEntries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                    {extraEntries.map(([k, v]) => (
                        <span key={k} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">{humanize(k)}: {v}</span>
                    ))}
                </div>
            )}
        </Card>
    );
}

function ActivityList({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
    const items = Array.isArray(children) ? children : [children];
    const hasItems = items.some(Boolean) && (Array.isArray(children) ? children.length > 0 : !!children);
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
            {hasItems ? <div className="space-y-2.5">{children}</div> : <p className="text-xs text-gray-400">{empty}</p>}
        </div>
    );
}

function ActivityRow({ primary, secondary, time }: { primary: string; secondary: string; time: string }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{primary || '—'}</p>
                <p className="text-[11px] text-gray-400 truncate capitalize">{secondary}</p>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">{time}</span>
        </div>
    );
}

export default Dashboard;
