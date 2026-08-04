import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';
import { cn } from '../../../shared/lib/utils';
import { resolvePeriodParams, type StandardPeriod } from '../../../shared/lib/period';
import { VERTICAL_CONFIG } from '../../../shared/nav/verticals';
import type { ListingVertical } from '../../../shared/nav/sections';
import {
    getListingStats,
    listListings,
    listPartners,
    isPartnerOnboarding,
    formatMoney,
    ApiError,
    type ListingStats,
    type PartnerListItem,
} from '../../../shared/lib/api';
import { fetchAllTransactions, sumAmount, uniqueCustomerCount } from './txAggregate';

interface OverviewTabProps {
    vertical: ListingVertical;
    period: StandardPeriod;
    dateFrom: string;
    dateTo: string;
}

const OverviewTab = ({ vertical, period, dateFrom, dateTo }: OverviewTabProps) => {
    const category = VERTICAL_CONFIG[vertical].category;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listingStats, setListingStats] = useState<ListingStats | null>(null);
    const [pausedCount, setPausedCount] = useState<number | null>(null);
    const [partners, setPartners] = useState<PartnerListItem[]>([]);
    const [revenue, setRevenue] = useState<number | null>(null);
    const [ticketsSold, setTicketsSold] = useState<number | null>(null);
    const [customers, setCustomers] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [stats, listings, partnerRows, txRows] = await Promise.all([
                getListingStats(vertical),
                listListings({ listing_type: vertical }),
                listPartners({ category }),
                fetchAllTransactions({ booking_type: vertical, ...resolvePeriodParams(period, dateFrom, dateTo) }),
            ]);
            setListingStats(stats);
            setPausedCount(listings.filter((l) => l.is_paused).length);
            setPartners(partnerRows);
            setRevenue(sumAmount(txRows));
            setTicketsSold(txRows.length);
            setCustomers(uniqueCustomerCount(txRows));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load overview.');
        } finally {
            setLoading(false);
        }
    }, [vertical, category, period, dateFrom, dateTo]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading && !listingStats) {
        return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>;
    }
    if (error) {
        return (
            <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
        );
    }

    const { date_from } = resolvePeriodParams(period, dateFrom, dateTo);
    const inPeriod = (createdAt: string) => !date_from || createdAt.slice(0, 10) >= date_from;

    const newPartners = partners.filter((p) => inPeriod(p.created_at)).length;
    const activePartners = partners.filter((p) => p.is_active).length;
    const inactivePartners = partners.filter((p) => !p.is_active).length;
    const profileIncomplete = partners.filter((p) => isPartnerOnboarding(p.status)).length;
    const reviewPending = partners.filter((p) => p.status === 'under_review').length;

    const healthTiles = [
        { label: 'Total Partners', value: partners.length },
        { label: 'Total Listings', value: listingStats?.total ?? 0 },
        { label: 'Total Customers', value: customers ?? 0 },
        { label: 'Total Revenue', value: revenue != null ? formatMoney(revenue) : '—' },
        { label: 'Total Tickets Sold', value: ticketsSold ?? 0 },
    ];

    const partnerRows = [
        { label: 'New Partners', value: newPartners, tone: 'text-green-600' },
        { label: 'Active', value: activePartners, tone: 'text-gray-900' },
        { label: 'Inactive', value: inactivePartners, tone: 'text-gray-500' },
        { label: 'Profile Incomplete', value: profileIncomplete, tone: 'text-amber-600' },
        { label: 'Partner Review Pending', value: reviewPending, tone: 'text-amber-600' },
    ];

    const listingRows = listingStats
        ? [
              { label: 'Live', value: listingStats.published, tone: 'text-green-600' },
              { label: 'Pending Listings', value: listingStats.pending, tone: 'text-amber-600' },
              { label: 'Paused Listings', value: pausedCount ?? 0, tone: 'text-orange-600' },
              { label: 'Rejected', value: listingStats.rejected, tone: 'text-red-600' },
              { label: 'Draft', value: listingStats.draft, tone: 'text-gray-500' },
              { label: 'Archived', value: listingStats.archived, tone: 'text-gray-400' },
          ]
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3">Health snapshot</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {healthTiles.map((t) => (
                        <Card key={t.label}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{t.value}</p>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Partner status breakdown</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {partnerRows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between px-6 py-3 text-sm">
                                <span className="text-gray-600">{r.label}</span>
                                <span className={cn('font-bold', r.tone)}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">{VERTICAL_CONFIG[vertical].label} listing metrics breakdown</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {listingRows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between px-6 py-3 text-sm">
                                <span className="text-gray-600">{r.label}</span>
                                <span className={cn('font-bold', r.tone)}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                Payouts, commission, and platform-fee breakdowns aren't shown here yet — they need
                backend support that doesn't exist for this vertical today.
            </div>
        </div>
    );
};

export default OverviewTab;
