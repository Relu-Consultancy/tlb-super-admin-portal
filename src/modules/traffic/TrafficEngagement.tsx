import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import PeriodFilter from '../../shared/components/ui/PeriodFilter';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import { resolvePeriodParams, type StandardPeriod } from '../../shared/lib/period';
import {
    getActivitySummary,
    getTopViewedListings,
    analyticsErrorMessage,
    listingTypeLabel,
    listingTypeTone,
    ApiError,
    type ActivitySummary,
    type TopViewedListing,
} from '../../shared/lib/api';

/**
 * Traffic & Engagement — app/website visits, active users, live-now counts,
 * page funnels, traffic sources, push engagement and top-viewed listings.
 *
 * The platform still has no traffic/pageview endpoint (visits, live-now,
 * page funnels, traffic sources, push stats stay "Coming Soon" below), but
 * `/admin/analytics/activity/summary/` and `/admin/analytics/listings/top-viewed/`
 * now cover the "Active customers/partners" KPIs and the top-viewed-listings
 * table — both require `VIEW_ANALYTICS`, so they fall back to the original
 * placeholder state for admins without that permission.
 */

// Bar colours per column (matches the reference design).
const GREEN = '#5fae6e';
const RED = '#e5675a';
const INDIGO = '#4F46E5';

interface BarDatum { label: string; percent: string }
interface PushStat { label: string; value: string }

const TRAFFIC = {
    mostViewed: [] as BarDatum[],
    dropOff: [] as BarDatum[],
    sources: [] as BarDatum[],
    pushStats: [
        { label: 'Push sent', value: '--' },
        { label: 'Delivery rate', value: '--' },
        { label: 'Open rate', value: '--' },
        { label: 'Tap-through rate', value: '--' },
    ] as PushStat[],
};

const TrafficEngagement = () => {
    const { hasPermission } = useAuth();
    const canViewAnalytics = hasPermission('VIEW_ANALYTICS');

    const [period, setPeriod] = useState<StandardPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [activity, setActivity] = useState<ActivitySummary | null>(null);
    const [activityError, setActivityError] = useState<string | null>(null);
    const [topViewed, setTopViewed] = useState<TopViewedListing[]>([]);
    const [topViewedError, setTopViewedError] = useState<string | null>(null);
    const [loading, setLoading] = useState(canViewAnalytics);

    const load = useCallback(async () => {
        if (!canViewAnalytics) {
            setLoading(false);
            return;
        }
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        setLoading(true);
        setActivityError(null);
        setTopViewedError(null);
        const params = resolvePeriodParams(period, dateFrom, dateTo);
        const [activityRes, topViewedRes] = await Promise.all([
            getActivitySummary(params).catch((e) => {
                setActivityError(e instanceof ApiError ? analyticsErrorMessage(e.code, e.message) : 'Failed to load activity.');
                return null;
            }),
            getTopViewedListings({ ...params, limit: 5 }).catch((e) => {
                setTopViewedError(e instanceof ApiError ? analyticsErrorMessage(e.code, e.message) : 'Failed to load top listings.');
                return null;
            }),
        ]);
        setActivity(activityRes);
        setTopViewed(topViewedRes?.top_viewed_listings ?? []);
        setLoading(false);
    }, [period, dateFrom, dateTo, canViewAnalytics]);

    useEffect(() => {
        load();
    }, [load]);

    const activityLoading = canViewAnalytics && loading && !activity && !activityError;
    const kpis = [
        { label: 'App visits', value: '--', comingSoon: true, loading: false },
        { label: 'Website visits', value: '--', comingSoon: true, loading: false },
        {
            label: 'Active customers',
            value: canViewAnalytics && activity ? activity.customers.active.toLocaleString() : '--',
            sub: canViewAnalytics && activity ? `${activity.customers.active_rate}% active` : undefined,
            comingSoon: !(canViewAnalytics && activity),
            loading: activityLoading,
        },
        {
            label: 'Active partners',
            value: canViewAnalytics && activity ? activity.partners.active.toLocaleString() : '--',
            sub: canViewAnalytics && activity ? `${activity.partners.active_rate}% active` : undefined,
            comingSoon: !(canViewAnalytics && activity),
            loading: activityLoading,
        },
        { label: 'Live now — app', value: '--', comingSoon: true, loading: false },
        { label: 'Live now — website', value: '--', comingSoon: true, loading: false },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Traffic &amp; Engagement</h1>
                <p className="text-gray-500 text-sm">App &amp; website visits, active users, and live-now counts</p>
            </header>

            {/* Period selector */}
            <PeriodFilter
                value={period}
                onChange={setPeriod}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
            />

            {/* KPI cards */}
            {activityError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="shrink-0" /> {activityError}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpis.map((k) => (
                    <Card key={k.label} className="flex flex-col gap-1 relative">
                        {k.comingSoon && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-500 rounded uppercase tracking-wider">
                                {k.loading ? <Loader2 size={10} className="animate-spin" /> : 'Coming Soon'}
                            </span>
                        )}
                        <p className="text-xs text-gray-500">{k.label}</p>
                        <p className={cn('text-3xl font-bold mt-1', k.comingSoon ? 'text-gray-300' : 'text-gray-900')}>{k.value}</p>
                        {k.sub && <p className="text-[11px] text-green-600 font-semibold mt-0.5">{k.sub}</p>}
                    </Card>
                ))}
            </div>

            {/* Breakdown columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <BarCard
                    title="Most viewed pages"
                    subtitle="Where customers spend the most time"
                    rows={TRAFFIC.mostViewed}
                    color={GREEN}
                />
                <BarCard
                    title="Where customers drop off"
                    subtitle="Last page viewed before leaving without booking"
                    rows={TRAFFIC.dropOff}
                    color={RED}
                />
                <BarCard
                    title="Traffic sources"
                    subtitle="Where visits are coming from"
                    rows={TRAFFIC.sources}
                    color={INDIGO}
                />
            </div>

            {/* Push notification engagement */}
            <Card>
                <h3 className="text-base font-bold text-gray-900">Push notification engagement</h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-4">App push campaigns this period</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TRAFFIC.pushStats.map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-3.5 relative">
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold bg-gray-200 text-gray-500 rounded uppercase tracking-wider">Coming Soon</span>
                            <p className="text-[11px] text-gray-500">{s.label}</p>
                            <p className="text-xl font-bold mt-1.5 text-gray-300">{s.value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Top viewed listings */}
            <Card className="p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900">Top viewed listings</h3>
                    {canViewAnalytics && (
                        <span className="text-[11px] text-gray-400">Updated nightly — today's views may not appear until tomorrow</span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listing</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vertical</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Views</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Enquiries</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Conv. rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!canViewAnalytics ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">Coming soon</td>
                                </tr>
                            ) : topViewedError ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-red-500 font-medium">{topViewedError}</td>
                                </tr>
                            ) : activityLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 size={20} className="animate-spin inline-block" />
                                    </td>
                                </tr>
                            ) : topViewed.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">No views recorded yet.</td>
                                </tr>
                            ) : (
                                topViewed.map((r) => (
                                    <tr key={r.listing_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{r.listing_name}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', listingTypeTone(r.vertical))}>
                                                {listingTypeLabel(r.vertical)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-gray-700 text-right">{r.views.toLocaleString()}</td>
                                        <td className="px-6 py-3.5 text-sm text-gray-700 text-right">{r.enquiries.toLocaleString()}</td>
                                        <td className="px-6 py-3.5 text-sm font-semibold text-right" style={{ color: GREEN }}>{r.conversion_rate.toFixed(1)}%</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function BarCard({ title, subtitle, rows, color }: { title: string; subtitle: string; rows: BarDatum[]; color: string }) {
    return (
        <Card>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">{subtitle}</p>
            <div>
                {rows.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400 font-medium bg-gray-50/50 rounded-lg border border-dashed border-gray-200">Coming soon</div>
                ) : (
                    rows.map((r) => (
                        <div key={r.label} className="mb-3.5 last:mb-0">
                            <div className="flex justify-between items-baseline text-xs mb-1.5 gap-2">
                                <span className="flex-1 min-w-0 truncate text-gray-700">{r.label}</span>
                                <span className="font-semibold text-gray-900 flex-none">{r.percent}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-1.5 rounded-full" style={{ width: r.percent, backgroundColor: color }} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

export default TrafficEngagement;
