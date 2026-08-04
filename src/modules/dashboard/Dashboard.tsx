import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    Users,
    Store,
    Layers,
    MessageSquare,
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
import PeriodFilter from '../../shared/components/ui/PeriodFilter';
import { cn } from '../../shared/lib/utils';
import { resolvePeriodParams, STANDARD_PERIOD_LABELS, type StandardPeriod } from '../../shared/lib/period';
import { VERTICALS as VERTICAL_TYPES, VERTICAL_CONFIG } from '../../shared/nav/verticals';
import { Screen } from '../../types';
import {
    getOverviewStats,
    getCustomerStats,
    getPartnerStats,
    getListingStats,
    parseAmount,
    safeCurrency,
    formatMoney,
    ApiError,
    type OverviewStats,
    type CustomerStats,
    type PartnerStats,
    type StatsParams,
    type ListingStats,
    type ListingType,
} from '../../shared/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The 4 moderated listing verticals, in display order, with their static blurb and matching partner category. */
const VERTICALS: { type: ListingType; label: string; subtitle: string; category: string }[] =
    VERTICAL_TYPES.map((type) => ({ type, ...VERTICAL_CONFIG[type] }));

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
    const [period, setPeriod] = useState<StandardPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<OverviewStats | null>(null);
    // Customer/Partner active-inactive & Pending-KYC come from the dedicated
    // stats endpoints (the overview payload doesn't carry them). Non-critical:
    // the dashboard still renders if these fail.
    const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
    const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
    // Per-vertical "active listings" (published count), keyed by listing type.
    // Non-critical: the dashboard still renders (as "—") if a type's fetch fails.
    const [verticalListingStats, setVerticalListingStats] = useState<Partial<Record<ListingType, ListingStats>>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        setLoading(true);
        setError(null);
        const params: StatsParams = resolvePeriodParams(period, dateFrom, dateTo);
        try {
            const [overview, custom, partner, ...verticalStats] = await Promise.all([
                getOverviewStats(params),
                getCustomerStats(params).catch(() => null),
                getPartnerStats(params).catch(() => null),
                ...VERTICALS.map((v) => getListingStats(v.type).catch(() => null)),
            ]);
            setData(overview);
            setCustomerStats(custom);
            setPartnerStats(partner);
            const byType: Partial<Record<ListingType, ListingStats>> = {};
            VERTICALS.forEach((v, i) => {
                const stats = verticalStats[i];
                if (stats) byType[v.type] = stats;
            });
            setVerticalListingStats(byType);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    }, [period, dateFrom, dateTo]);

    useEffect(() => { load(); }, [load]);

    const currency = safeCurrency(data?.revenue?.currency);
    const money = (v: string | number | null | undefined) => formatMoney(parseAmount(v) ?? 0, currency);

    const periodLabel = STANDARD_PERIOD_LABELS[period];
    const num = (n: number | null | undefined) => (n ?? 0).toLocaleString('en-IN');
    /** Show a real count, or an em-dash when the (optional) stats source is unavailable. */
    const show = (n: number | null | undefined) => (n == null ? '—' : num(n));

    // KPI values (safe defaults)
    const totalCustomers = data?.users?.total_customers ?? 0;
    const newCustomers = data?.users?.new_customers ?? 0;
    const totalPartners = data?.users?.total_partners ?? 0;
    const newPartners = data?.users?.new_partners ?? 0;
    const totalListings = data?.listings?.total ?? 0;
    const draftListings = data?.listings?.draft ?? 0;
    const pendingListings = data?.listings?.pending_moderation ?? 0;
    const liveListings = data?.listings?.published ?? 0; // "Live" = published (backend has no live-vs-paused aggregate)
    const totalBookings = data?.bookings?.total ?? 0;
    const totalOpenTickets = data?.support?.total_open ?? 0;
    const grossRevenue = parseAmount(data?.revenue?.gross) ?? 0;

    // Active/Inactive & Pending-KYC from the dedicated stats endpoints.
    // NOTE: backend active/inactive is the account enable-flag, not the guide's
    // "meaningful activity" definition — surfaced as-is pending a backend field.
    const activeCustomers = customerStats?.summary?.active ?? null;
    const inactiveCustomers = customerStats?.summary?.inactive ?? null;
    const activePartners = partnerStats?.summary?.active ?? null;
    const inactivePartners = partnerStats?.summary?.inactive ?? null;
    const pendingKyc = partnerStats?.pending_actions?.awaiting_verification ?? null;

    /** Partner count for a vertical, from the partner stats' category breakdown (or `null` if unavailable). */
    const partnerCountFor = (category: string): number | null => {
        const entry = partnerStats?.by_category?.find((c) => c.category.toLowerCase() === category.toLowerCase());
        return entry ? entry.partner_count : null;
    };

    const QUICK_ACTIONS = [
        { label: 'Pending listings', count: pendingListings, icon: CheckCircle, color: 'bg-green-500', screen: Screen.EVENT_APPROVAL },
        { label: 'Review partner registrations', count: newPartners, icon: FileText, color: 'bg-blue-500', screen: Screen.PARTNER_MANAGEMENT },
        { label: 'Create listing for partner', icon: Layers, color: 'bg-orange-400', screen: Screen.EVENT_APPROVAL },
        { label: 'Create partner profile', icon: UserPlus, color: 'bg-amber-400', screen: Screen.PARTNER_MANAGEMENT },
    ];

    const publishedListings = liveListings;
    const refundedBookings = data?.bookings?.refunded ?? 0;

    // Activity summary — aggregate counts for the period, all from the overview stats.
    type SummaryRow = { icon: LucideIcon; tone: string; text: string };
    const pLabel = periodLabel.toLowerCase();
    const summaryRows: SummaryRow[] = data
        ? [
              { icon: Users, tone: 'bg-blue-50 text-blue-600', text: `${newCustomers.toLocaleString('en-IN')} new customers signed up on the app ${pLabel}` },
              { icon: Store, tone: 'bg-purple-50 text-purple-600', text: `${newPartners.toLocaleString('en-IN')} new partners registered ${pLabel}` },
              { icon: FileText, tone: 'bg-amber-50 text-amber-600', text: `${liveListings.toLocaleString('en-IN')} new listings published across verticals ${pLabel}` },
              { icon: Ticket, tone: 'bg-orange-50 text-orange-600', text: `${totalBookings.toLocaleString('en-IN')} tickets sold — Events & Venues ${pLabel}` },
              { icon: MessageSquare, tone: 'bg-teal-50 text-teal-600', text: `${totalOpenTickets.toLocaleString('en-IN')} enquiries received — Classes, Programs & Venues ${pLabel}` },
              { icon: CheckCircle, tone: 'bg-green-50 text-green-600', text: `${pendingListings.toLocaleString('en-IN')} approvals completed — partners & listings ${pLabel}` },
              { icon: IndianRupee, tone: 'bg-amber-50 text-amber-700', text: `${formatLakhsCrores(grossRevenue)} platform revenue collected ${pLabel}` },
              ...(refundedBookings > 0
                  ? [{ icon: CornerUpLeft, tone: 'bg-red-50 text-red-600', text: `${refundedBookings.toLocaleString('en-IN')} new refund request${refundedBookings > 1 ? 's' : ''} awaiting review ${pLabel}` } as SummaryRow]
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
                            <span className="flex items-center gap-1" title="Coming soon">
                                <Smartphone size={12} className="text-gray-400" />
                                <span className="font-bold text-gray-400">--</span>
                                <span className="text-[10px] text-gray-400">on app (Coming Soon)</span>
                            </span>
                            <span className="flex items-center gap-1" title="Coming soon">
                                <Monitor size={12} className="text-gray-400" />
                                <span className="font-bold text-gray-400">--</span>
                                <span className="text-[10px] text-gray-400">on website (Coming Soon)</span>
                            </span>
                        </div>
                    </div>

                    {/* Period selector */}
                    <PeriodFilter
                        value={period}
                        onChange={setPeriod}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                    />

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
                    Showing data for: <span className="text-amber-600 font-semibold">{periodLabel}</span>
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
                    {/* Cross-vertical health check */}
                    <MetricSection title="Cross-vertical health check" subtitle="(Till Date)" gridClass="grid-cols-2 md:grid-cols-6">
                        <MetricTile label="Total Customers" value={num(totalCustomers)} icon={Users} />
                        <MetricTile label="Total Partners" value={num(totalPartners)} icon={Store} />
                        <MetricTile label="Total Listings" value={num(totalListings)} icon={Layers} />
                        <MetricTile label="Bookings / Tickets Sold" value={num(totalBookings)} icon={Ticket} tone="text-green-600" />
                        <MetricTile label="Enquiries" value={num(totalOpenTickets)} icon={MessageSquare} tone="text-teal-600" />
                        <Card variant="highlight" className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Platform Revenue</p>
                                <span className="text-[10px] text-amber-600">{periodLabel}</span>
                            </div>
                            <p className="text-xl font-bold text-amber-800 mt-1">
                                {formatLakhsCrores(grossRevenue)}
                            </p>
                        </Card>
                    </MetricSection>

                    {/* Listings by Vertical */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 mb-3">At-a-glance: Listings by Vertical</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Card className="flex flex-col gap-1 bg-blue-50/50 border-blue-100">
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Customers</p>
                                <p className="text-[11px] text-blue-500 -mt-0.5">App users</p>
                                <div className="flex items-end gap-4 mt-1.5">
                                    <div>
                                        <p className="text-2xl font-bold text-blue-900">{num(totalCustomers)}</p>
                                        <span className="text-[11px] text-blue-600">total</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-amber-600">{num(newCustomers)}</p>
                                        <span className="text-[11px] text-blue-600">new</span>
                                    </div>
                                </div>
                            </Card>
                            {VERTICALS.map((v) => {
                                const stats = verticalListingStats[v.type];
                                const partners = partnerCountFor(v.category);
                                return (
                                    <Card key={v.type} className="flex flex-col gap-1">
                                        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">{v.label}</p>
                                        <p className="text-[11px] text-gray-400 -mt-0.5">{v.subtitle}</p>
                                        <div className="flex items-end gap-4 mt-1.5">
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900">{show(partners)}</p>
                                                <span className="text-[11px] text-gray-500">partners</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-amber-600">{stats ? num(stats.published) : '—'}</p>
                                                <span className="text-[11px] text-gray-500">active listings</span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
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
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-sm transition-all group text-center"
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

/** A titled group of metric tiles (Customers / Partners / Listings / …). */
function MetricSection({ title, subtitle, gridClass, children }: { title: string; subtitle?: string; gridClass: string; children: ReactNode }) {
    return (
        <div>
            <div className="mb-3">
                <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
            </div>
            <div className={cn('grid gap-4', gridClass)}>{children}</div>
        </div>
    );
}

/** A single metric tile: label, big value, and a period/status note. */
function MetricTile({ label, value, note, tone, icon: Icon }: { label: string; value: string; note?: string; tone?: string; icon?: LucideIcon }) {
    return (
        <Card className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                {Icon && <Icon size={14} className="text-gray-300 shrink-0" />}
            </div>
            <p className={cn('text-3xl font-bold mt-1', tone || 'text-gray-900')}>{value}</p>
            {note && <span className="text-[11px] text-gray-400">{note}</span>}
        </Card>
    );
}

export default Dashboard;
