import { useState } from 'react';
import { LayoutGrid, Store, ListChecks, Ticket, IndianRupee, BarChart3, LifeBuoy } from 'lucide-react';
import PeriodFilter from '../../shared/components/ui/PeriodFilter';
import Tabs, { type TabItem } from '../../shared/components/ui/Tabs';
import { VERTICAL_CONFIG } from '../../shared/nav/verticals';
import type { ListingVertical } from '../../shared/nav/sections';
import type { StandardPeriod } from '../../shared/lib/period';
import PartnerManagement from '../partners/PartnerManagement';
import EventApproval from './EventApproval';
import OverviewTab from './tabs/OverviewTab';
import TicketingTab from './tabs/TicketingTab';
import FinancialsTab from './tabs/FinancialsTab';
import ReportsTab from './tabs/ReportsTab';
import SupportTab from './tabs/SupportTab';

type TabId = 'overview' | 'partners' | 'listings' | 'ticketing' | 'financials' | 'reports' | 'support';

const TABS: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'partners', label: 'Partner directory', icon: Store },
    { id: 'listings', label: 'Listing directory', icon: ListChecks },
    { id: 'ticketing', label: 'Ticketing', icon: Ticket },
    { id: 'financials', label: 'Financials', icon: IndianRupee },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'support', label: 'Support', icon: LifeBuoy },
];

interface VerticalDashboardProps {
    vertical: ListingVertical;
}

/** Per-vertical (Events/Programs/Classes/Venues) tabbed dashboard — replaces the old flat Listings Approval screen. */
const VerticalDashboard = ({ vertical }: VerticalDashboardProps) => {
    const meta = VERTICAL_CONFIG[vertical];
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [period, setPeriod] = useState<StandardPeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const needsPeriod = activeTab === 'overview' || activeTab === 'ticketing' || activeTab === 'financials';

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{meta.label}</h1>
                    <p className="text-gray-500 text-sm">Health check and quick access for the {meta.label.toLowerCase()} vertical</p>
                </div>
                {needsPeriod && (
                    <PeriodFilter
                        value={period}
                        onChange={setPeriod}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                    />
                )}
            </header>

            <Tabs tabs={TABS} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} layoutId={`vertical-tab-${vertical}`} />

            {activeTab === 'overview' && <OverviewTab vertical={vertical} period={period} dateFrom={dateFrom} dateTo={dateTo} />}
            {activeTab === 'partners' && <PartnerManagement category={meta.category} lockCategory />}
            {activeTab === 'listings' && <EventApproval listingType={vertical} lockType />}
            {activeTab === 'ticketing' && <TicketingTab vertical={vertical} period={period} dateFrom={dateFrom} dateTo={dateTo} />}
            {activeTab === 'financials' && <FinancialsTab vertical={vertical} period={period} dateFrom={dateFrom} dateTo={dateTo} />}
            {activeTab === 'reports' && <ReportsTab vertical={vertical} />}
            {activeTab === 'support' && <SupportTab vertical={vertical} />}
        </div>
    );
};

export default VerticalDashboard;
