import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analytics from './Analytics';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => null,
    Cell: () => null,
}));

vi.mock('../../shared/lib/api', () => ({
    getOverviewStats: vi.fn(),
    parseAmount: (v: any) => (v == null || v === '' || v === '-' ? null : (Number.isNaN(Number(v)) ? null : Number(v))),
    safeCurrency: () => 'INR',
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    STATS_PERIODS: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'custom'],
    STATS_PERIOD_LABELS: { today: 'Today', yesterday: 'Yesterday', this_week: 'This Week', last_week: 'Last Week', this_month: 'This Month', custom: 'Custom Range' },
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { getOverviewStats } from '../../shared/lib/api';

const OVERVIEW = {
    period: { type: 'this_month', date_from: '2026-06-01', date_to: '2026-06-30', label: 'This Month' },
    users: { total_customers: 1200, total_partners: 80, new_customers: 45, new_partners: 6 },
    listings: { total: 310, published: 240, pending_moderation: 14, rejected: 5, draft: 51, by_type: { event: 120, venue: 60, program: 80, class: 50 } },
    bookings: { total: 540, confirmed: 500, cancelled: 20, refunded: 10, pending: 10, attended: 480 },
    revenue: { gross: '500000', refunds: '8000', net: '460000', platform_fees: '32000', avg_order_value: '925', currency: 'INR' },
    support: { open: 7, in_progress: 3, resolved_in_period: 22, total_open: 10 },
    trend: [{ date: '2026-06-01', bookings: 10, revenue: '9000', signups: 5 }],
    recent_activity: {
        bookings: [{ id: 'bk1', booking_reference: 'BK-001', status: 'confirmed', amount: '999', customer_email: 'a@x.com', created_at: '2026-06-05T10:00:00Z' }],
        signups: [], tickets: [],
    },
};

describe('Analytics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getOverviewStats as any).mockResolvedValue(OVERVIEW);
    });

    it('renders the heading and loads overview stats', async () => {
        render(<Analytics />);
        expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
        await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith({ period: 'this_month' }));
    });

    it('fills KPI cards from the stats API', async () => {
        render(<Analytics />);
        expect(await screen.findByText('540')).toBeInTheDocument(); // total bookings
        expect(screen.getByText('Total Bookings')).toBeInTheDocument();
        expect(screen.getByText('Net Revenue')).toBeInTheDocument();
        expect(screen.getByText('1,200')).toBeInTheDocument(); // customers
    });

    it('renders the bookings bar chart and listings-by-type pie', async () => {
        render(<Analytics />);
        await screen.findByText('540');
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByText('Listings by Type')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('renders booking status counts from the API', async () => {
        render(<Analytics />);
        await screen.findByText('540');
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument(); // confirmed count
        expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
        expect(screen.getByText('BK-001')).toBeInTheDocument();
    });

    it('re-fetches when the period changes', async () => {
        render(<Analytics />);
        await screen.findByText('540');
        await userEvent.click(screen.getByRole('button', { name: 'As of Today' }));
        await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith({ period: 'today' }));
    });

    it('shows an error state when the API fails', async () => {
        (getOverviewStats as any).mockRejectedValue(new Error('boom'));
        render(<Analytics />);
        expect(await screen.findByText("Couldn't load analytics")).toBeInTheDocument();
    });
});
