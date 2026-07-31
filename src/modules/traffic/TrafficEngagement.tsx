import { useState } from 'react';
import Card from '../../shared/components/ui/Card';
import PeriodFilter from '../../shared/components/ui/PeriodFilter';
import { cn } from '../../shared/lib/utils';
import { type StandardPeriod } from '../../shared/lib/period';

/**
 * Traffic & Engagement — app/website visits, active users, live-now counts,
 * page funnels, traffic sources, push engagement and top-viewed listings.
 *
 * NOTE: the platform does not yet expose a traffic/analytics endpoint, so the
 * figures below are the representative dataset from the reference design. They
 * are held in one typed `TRAFFIC` object so a future `/admin/traffic/` service
 * can replace it verbatim (same shape) without touching the layout.
 */

// Bar colours per column (matches the reference design).
const GREEN = '#5fae6e';
const RED = '#e5675a';
const INDIGO = '#4F46E5';

interface Kpi { label: string; value: string; accent?: boolean }
interface BarDatum { label: string; percent: string }
interface PushStat { label: string; value: string }
interface TopListing { listing: string; vertical: string; views: string; enquiries: string; convRate: string }

const TRAFFIC = {
    kpis: [
        { label: 'App visits', value: '--' },
        { label: 'Website visits', value: '--' },
        { label: 'Active customers (app)', value: '--' },
        { label: 'Active partners (website)', value: '--' },
        { label: 'Live now — app', value: '--', accent: true },
        { label: 'Live now — website', value: '--', accent: true },
    ] as Kpi[],
    mostViewed: [] as BarDatum[],
    dropOff: [] as BarDatum[],
    sources: [] as BarDatum[],
    pushStats: [
        { label: 'Push sent', value: '--' },
        { label: 'Delivery rate', value: '--' },
        { label: 'Open rate', value: '--' },
        { label: 'Tap-through rate', value: '--' },
    ] as PushStat[],
    topViewed: [] as TopListing[],
};

const TrafficEngagement = () => {
    const [period, setPeriod] = useState<StandardPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TRAFFIC.kpis.map((k) => (
                    <Card key={k.label} className="flex flex-col gap-1 relative">
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-500 rounded uppercase tracking-wider">Coming Soon</span>
                        <p className="text-xs text-gray-500">{k.label}</p>
                        <p className={cn('text-3xl font-bold mt-1 text-gray-300')}>{k.value}</p>
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
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900">Top viewed listings</h3>
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
                            {TRAFFIC.topViewed.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">Coming soon</td>
                                </tr>
                            ) : (
                                TRAFFIC.topViewed.map((r) => (
                                    <tr key={r.listing} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{r.listing}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-gray-100 text-gray-600">
                                                {r.vertical}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-gray-700 text-right">{r.views}</td>
                                        <td className="px-6 py-3.5 text-sm text-gray-700 text-right">{r.enquiries}</td>
                                        <td className="px-6 py-3.5 text-sm font-semibold text-right" style={{ color: GREEN }}>{r.convRate}</td>
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
