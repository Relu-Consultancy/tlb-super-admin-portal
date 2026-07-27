import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Store,
    Layers,
    CalendarCheck,
    MessageSquare,
    ChevronRight,
    Loader2,
    AlertCircle,
    TrendingUp,
    Activity,
    CheckCircle,
    FileText,
    UserPlus,
    ArrowUpRight,
    Monitor,
    Smartphone,
    Ticket,
    IndianRupee,
    CornerUpLeft,
    Clock,
    type LucideIcon,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { Screen } from '../../types';
import {
    getOverviewStats,
    parseAmount,
    safeCurrency,
    formatMoney,
    ApiError,
    type OverviewStats,
    type StatsParams,
} from '../../shared/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLakhsCrores(value: number): string {
    if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)}L`;
    return `Rs ${value.toLocaleString('en-IN')}`;
}

/** Compact relative time, e.g. "just now", "12m ago", "3h ago", "2d ago", "12 Jun". */
function timeAgo(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

/** Friendly singular noun for a signup role. */
function roleWord(role: string | null | undefined): string {
    const r = (role || '').toLowerCase();
    if (r === 'partner') return 'partner';
    if (r === 'customer') return 'customer';
    return r || 'user';
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const Dashboard = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
    const [data, setData] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // "Till date" = full lifetime stats
            setData(await getOverviewStats({ period: 'this_month' }));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const currency = safeCurrency(data?.revenue?.currency);
    const money = (v: string | number | null | undefined) => formatMoney(parseAmount(v) ?? 0, currency);

    // KPI values (safe defaults)
    const totalCustomers = data?.users?.total_customers ?? 0;
    const newCustomers = data?.users?.new_customers ?? 0;
    const totalPartners = data?.users?.total_partners ?? 0;
    const newPartners = data?.users?.new_partners ?? 0;
    const totalListings = data?.listings?.total ?? 0;
    const pendingListings = data?.listings?.pending_moderation ?? 0;
    const totalBookings = data?.bookings?.total ?? 0;
    const totalOpenTickets = data?.support?.total_open ?? 0;
    const grossRevenue = parseAmount(data?.revenue?.gross) ?? 0;
    const byType = data?.listings?.by_type ?? {};
    const eventsCount = byType.event ?? 0;
    const programsCount = byType.program ?? 0;
    const classesCount = byType.class ?? 0;
    const venuesCount = byType.venue ?? 0;

    const QUICK_ACTIONS = [
        { label: 'Pending listings', count: pendingListings, icon: CheckCircle, color: 'bg-green-500', screen: Screen.EVENT_APPROVAL },
        { label: 'Review partner registrations', count: newPartners, icon: FileText, color: 'bg-blue-500', screen: Screen.PARTNER_MANAGEMENT },
        { label: 'Create listing for partner', icon: Layers, color: 'bg-orange-400', screen: Screen.EVENT_APPROVAL },
        { label: 'Create partner profile', icon: UserPlus, color: 'bg-amber-400', screen: Screen.PARTNER_MANAGEMENT },
    ];

    // The period this snapshot covers (e.g. "This Month"), for the summary tags.
    const periodLabel = data?.period?.label || 'this period';
    const publishedListings = data?.listings?.published ?? 0;
    const refundedBookings = data?.bookings?.refunded ?? 0;

    // Activity summary — aggregate counts for the period, all from the overview stats.
    type SummaryRow = { icon: LucideIcon; tone: string; text: string };
    const summaryRows: SummaryRow[] = data
        ? [
              { icon: Users, tone: 'bg-blue-50 text-blue-600', text: `${newCustomers.toLocaleString('en-IN')} new customers signed up on the app` },
              { icon: Store, tone: 'bg-purple-50 text-purple-600', text: `${newPartners.toLocaleString('en-IN')} new partners registered` },
              { icon: FileText, tone: 'bg-amber-50 text-amber-600', text: `${publishedListings.toLocaleString('en-IN')} listings published across verticals` },
              { icon: Ticket, tone: 'bg-orange-50 text-orange-600', text: `${totalBookings.toLocaleString('en-IN')} bookings / tickets sold — Events & Venues` },
              { icon: MessageSquare, tone: 'bg-teal-50 text-teal-600', text: `${totalOpenTickets.toLocaleString('en-IN')} enquiries open across Classes, Programs & Venues` },
              { icon: IndianRupee, tone: 'bg-amber-50 text-amber-700', text: `${formatLakhsCrores(grossRevenue)} platform revenue collected` },
              ...(pendingListings > 0
                  ? [{ icon: CheckCircle, tone: 'bg-green-50 text-green-600', text: `${pendingListings.toLocaleString('en-IN')} listings awaiting review` } as SummaryRow]
                  : []),
              ...(refundedBookings > 0
                  ? [{ icon: CornerUpLeft, tone: 'bg-red-50 text-red-600', text: `${refundedBookings.toLocaleString('en-IN')} refund${refundedBookings > 1 ? 's' : ''} awaiting review` } as SummaryRow]
                  : []),
          ]
        : [];

    // Recent activity — merge the three recent_activity feeds into one time-sorted list.
    type FeedKind = 'booking' | 'signup' | 'ticket';
    type FeedItem = { id: string; kind: FeedKind; title: string; meta?: string; at: string };
    const ra = data?.recent_activity;
    const feed: FeedItem[] = data
        ? [
              ...(ra?.bookings ?? []).map((b) => ({
                  id: `b-${b.id}`,
                  kind: 'booking' as const,
                  title: `New booking — ${b.booking_reference || 'Order'}`,
                  meta: parseAmount(b.amount) != null ? money(b.amount) : b.customer_email,
                  at: b.created_at,
              })),
              ...(ra?.signups ?? []).map((s) => ({
                  id: `s-${s.id}`,
                  kind: 'signup' as const,
                  title: `New ${roleWord(s.role)} signed up`,
                  meta: s.email,
                  at: s.created_at,
              })),
              ...(ra?.tickets ?? []).map((t) => ({
                  id: `t-${t.id}`,
                  kind: 'ticket' as const,
                  title: `Enquiry received — ${t.subject || t.category || 'Support ticket'}`,
                  meta: t.raised_by_role ? `by ${roleWord(t.raised_by_role)}` : undefined,
                  at: t.created_at,
              })),
          ]
              .filter((i) => i.at)
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .slice(0, 6)
        : [];
    const FEED_ICON: Record<FeedKind, LucideIcon> = { booking: Ticket, signup: UserPlus, ticket: MessageSquare };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    {!loading && data && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            <Activity size={12} />
                            Listings Live on Platform: {totalListings}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Traffic Live widget */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Traffic Live</p>
                            <p className="text-[10px] text-gray-400">Active on the platform right now</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                                <Smartphone size={12} className="text-gray-400" />
                                <span className="font-bold text-gray-900">—</span>
                                <span className="text-[10px] text-gray-400">on app</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Monitor size={12} className="text-gray-400" />
                                <span className="font-bold text-gray-900">—</span>
                                <span className="text-[10px] text-gray-400">on website</span>
                            </span>
                        </div>
                    </div>

                    {/* Period selector */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                        <CalendarCheck size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-700">Till date</span>
                    </div>

                    {/* View trend charts */}
                    <button
                        onClick={() => setScreen(Screen.ANALYTICS)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <TrendingUp size={14} />
                        View trend charts
                    </button>
                </div>
            </header>

            {/* Subtitle */}
            <div>
                <p className="text-sm text-gray-600">Cross-vertical health check across Customers & Partners</p>
                <p className="text-xs text-gray-400 mt-1">
                    Showing data for: <span className="text-amber-600 font-semibold">Till date (since launch)</span>
                </p>
            </div>

            {error ? (
                <EmptyState icon={AlertCircle} title="Couldn't load statistics" description={error} />
            ) : loading && !data ? (
                <div className="flex items-center justify-center py-24 text-gray-400">
                    <Loader2 className="animate-spin" size={28} />
                </div>
            ) : !data ? (
                <EmptyState icon={TrendingUp} title="No data available" description="Statistics will appear here once data is loaded." />
            ) : (
                <>
                    {/* KPI Cards — Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KpiCard
                            label="TOTAL CUSTOMERS"
                            value={totalCustomers.toLocaleString('en-IN')}
                            sub="Till date total"
                            change={`+${newCustomers} today`}
                            icon={Users}
                        />
                        <KpiCard
                            label="TOTAL PARTNERS"
                            value={totalPartners.toLocaleString('en-IN')}
                            sub="Till date total"
                            change={`+${newPartners} today`}
                            icon={Store}
                        />
                        <KpiCard
                            label="TOTAL LISTINGS"
                            value={totalListings.toLocaleString('en-IN')}
                            sub="Till date"
                            change={`+${pendingListings} today`}
                            icon={Layers}
                        />
                    </div>

                    {/* KPI Cards — Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KpiCard
                            label="BOOKINGS / TICKETS SOLD"
                            value={totalBookings.toLocaleString('en-IN')}
                            sub="Till date"
                        />
                        <KpiCard
                            label="ENQUIRIES"
                            value={totalOpenTickets.toLocaleString('en-IN')}
                            sub="Till date"
                        />
                        <Card variant="highlight" className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">PLATFORM REVENUE</p>
                                <span className="text-[10px] text-amber-600">Till date</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-800 mt-1">
                                {formatLakhsCrores(grossRevenue)}
                            </p>
                            <button
                                onClick={() => setScreen(Screen.FINANCE_DASHBOARD)}
                                className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 mt-1 transition-colors"
                            >
                                View breakdown
                                <ArrowUpRight size={12} />
                            </button>
                        </Card>
                    </div>

                    {/* At-a-glance */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 mb-3">At-a-glance: listings by vertical</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <GlanceCard
                                title="Customers"
                                subtitle="App users"
                                stat1Label="total"
                                stat1Value={totalCustomers.toLocaleString('en-IN')}
                                stat2Label="new"
                                stat2Value={newCustomers.toLocaleString('en-IN')}
                                stat2Color="text-green-600"
                            />
                            <GlanceCard
                                title="Events"
                                subtitle="Ticketing / commission"
                                stat1Label="partners"
                                stat1Value="—"
                                stat2Label="active listings"
                                stat2Value={eventsCount.toLocaleString('en-IN')}
                                stat2Color="text-amber-600"
                            />
                            <GlanceCard
                                title="Programs"
                                subtitle="Enquiry credits"
                                stat1Label="partners"
                                stat1Value="—"
                                stat2Label="active listings"
                                stat2Value={programsCount.toLocaleString('en-IN')}
                                stat2Color="text-amber-600"
                            />
                            <GlanceCard
                                title="Classes"
                                subtitle="Enquiry credits"
                                stat1Label="partners"
                                stat1Value="—"
                                stat2Label="active listings"
                                stat2Value={classesCount.toLocaleString('en-IN')}
                                stat2Color="text-amber-600"
                            />
                            <GlanceCard
                                title="Venues"
                                subtitle="Hybrid model"
                                stat1Label="partners"
                                stat1Value="—"
                                stat2Label="active listings"
                                stat2Value={venuesCount.toLocaleString('en-IN')}
                                stat2Color="text-amber-600"
                            />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => setScreen(action.screen)}
                                    className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-sm transition-all group text-center"
                                >
                                    <div className="relative">
                                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', action.color)}>
                                            <action.icon size={20} />
                                        </div>
                                        {action.count != null && action.count > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                                {action.count > 99 ? '99+' : action.count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">
                                        {action.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity summary + Recent activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Activity summary — aggregate counts for the period */}
                        <Card className="lg:col-span-2 p-0 overflow-hidden">
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                                <h2 className="text-base font-bold text-gray-900">Activity summary</h2>
                                <span className="text-xs text-gray-400">for {periodLabel}</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {summaryRows.map((row, i) => (
                                    <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', row.tone)}>
                                            <row.icon size={16} />
                                        </div>
                                        <p className="text-sm text-gray-700 flex-1">{row.text}</p>
                                        <span className="text-xs text-gray-400 flex-shrink-0">{periodLabel}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Recent activity — live feed merged from bookings, signups & tickets */}
                        <Card className="p-0 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-base font-bold text-gray-900">Recent activity</h2>
                                <button
                                    onClick={() => setScreen(Screen.ANALYTICS)}
                                    className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                >
                                    View all <ArrowUpRight size={12} />
                                </button>
                            </div>
                            {feed.length === 0 ? (
                                <div className="px-6 py-10 text-center text-sm text-gray-400">No recent activity yet.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {feed.map((item) => {
                                        const Icon = FEED_ICON[item.kind];
                                        return (
                                            <div key={item.id} className="flex items-start gap-3 px-6 py-3.5">
                                                <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Icon size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                                    {item.meta && <p className="text-xs text-gray-400 truncate">{item.meta}</p>}
                                                </div>
                                                <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap flex items-center gap-1">
                                                    <Clock size={11} /> {timeAgo(item.at)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Presentational components
// ---------------------------------------------------------------------------

interface KpiCardProps {
    label: string;
    value: string;
    sub: string;
    change?: string;
    icon?: typeof Users;
}

function KpiCard({ label, value, sub, change, icon: Icon }: KpiCardProps) {
    return (
        <Card className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">{label}</p>
                <span className="text-[10px] text-gray-400">Till date</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-gray-400">{sub}</span>
                {change && (
                    <span className="text-[11px] text-green-600 font-semibold flex items-center gap-0.5">
                        ↑ {change}
                    </span>
                )}
            </div>
        </Card>
    );
}

interface GlanceCardProps {
    title: string;
    subtitle: string;
    stat1Label: string;
    stat1Value: string;
    stat2Label: string;
    stat2Value: string;
    stat2Color?: string;
}

function GlanceCard({ title, subtitle, stat1Label, stat1Value, stat2Label, stat2Value, stat2Color }: GlanceCardProps) {
    return (
        <Card className="flex flex-col gap-2">
            <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-[10px] text-gray-400">{subtitle}</p>
            </div>
            <div className="flex items-end gap-3">
                <div>
                    <p className="text-xl font-bold text-gray-900">{stat1Value}</p>
                    <p className="text-[10px] text-gray-400">{stat1Label}</p>
                </div>
                <div>
                    <p className={cn('text-xl font-bold', stat2Color || 'text-gray-900')}>{stat2Value}</p>
                    <p className="text-[10px] text-gray-400">{stat2Label}</p>
                </div>
            </div>
        </Card>
    );
}

export default Dashboard;
