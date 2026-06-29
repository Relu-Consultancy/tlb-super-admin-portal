import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { Screen } from '../../types';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
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
    revenue: { gross: '500000.00', refunds: '8000.00', net: '460000.00', platform_fees: '32000.00', avg_order_value: '925.00', currency: 'INR' },
    support: { open: 7, in_progress: 3, resolved_in_period: 22, total_open: 10 },
    trend: [
        { date: '2026-06-01', bookings: 10, revenue: '9000.00', signups: 5 },
        { date: '2026-06-02', bookings: 14, revenue: '12000.00', signups: 8 },
    ],
    recent_activity: {
        bookings: [{ id: 'bk1', booking_reference: 'BK-001', status: 'confirmed', amount: '999.00', customer_email: 'a@x.com', created_at: '2026-06-05T10:00:00Z' }],
        signups: [{ id: 'su1', email: 'newbie@x.com', role: 'customer', auth_provider: 'otp', created_at: '2026-06-05T09:00:00Z' }],
        tickets: [{ id: 'tk1', subject: 'Refund please', category: 'refund_status', status: 'open', raised_by_role: 'customer', created_at: '2026-06-05T08:00:00Z' }],
    },
};

describe('Dashboard', () => {
    const setScreen = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (getOverviewStats as any).mockResolvedValue(OVERVIEW);
    });

    it('renders the heading and loads overview stats', async () => {
        render(<Dashboard setScreen={setScreen} />);
        expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
        await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith({ period: 'this_month' }));
    });

    it('renders KPI cards from the API', async () => {
        render(<Dashboard setScreen={setScreen} />);
        expect(await screen.findByText('1,200')).toBeInTheDocument(); // customers
        expect(screen.getByText('Customers')).toBeInTheDocument();
        expect(screen.getByText('Partners')).toBeInTheDocument();
        expect(screen.getByText('540')).toBeInTheDocument(); // bookings total
    });

    it('renders the trend chart and breakdown sections', async () => {
        render(<Dashboard setScreen={setScreen} />);
        await screen.findByText('1,200');
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByText('Activity Trend')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('shows recent activity items', async () => {
        render(<Dashboard setScreen={setScreen} />);
        expect(await screen.findByText('BK-001')).toBeInTheDocument();
        expect(screen.getByText('newbie@x.com')).toBeInTheDocument();
        expect(screen.getByText('Refund please')).toBeInTheDocument();
    });

    it('re-fetches when the period changes', async () => {
        render(<Dashboard setScreen={setScreen} />);
        await screen.findByText('1,200');
        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith({ period: 'today' }));
    });

    it('reveals custom date inputs and waits for both ends', async () => {
        render(<Dashboard setScreen={setScreen} />);
        await screen.findByText('1,200');
        (getOverviewStats as any).mockClear();
        await userEvent.click(screen.getByRole('button', { name: 'Custom Range' }));
        // No fetch until both dates are set.
        expect(getOverviewStats).not.toHaveBeenCalled();
    });

    it('quick actions navigate to the right screens', async () => {
        render(<Dashboard setScreen={setScreen} />);
        await screen.findByText('1,200');
        await userEvent.click(screen.getByText('Approve Partners'));
        expect(setScreen).toHaveBeenCalledWith(Screen.PARTNER_MANAGEMENT);
        await userEvent.click(screen.getByText('Approve Listings'));
        expect(setScreen).toHaveBeenCalledWith(Screen.EVENT_APPROVAL);
        await userEvent.click(screen.getByText('Send a Broadcast'));
        expect(setScreen).toHaveBeenCalledWith(Screen.BROADCASTS);
    });

    it('shows an error state when the API fails', async () => {
        (getOverviewStats as any).mockRejectedValue(new Error('boom'));
        render(<Dashboard setScreen={setScreen} />);
        expect(await screen.findByText("Couldn't load statistics")).toBeInTheDocument();
    });
});
