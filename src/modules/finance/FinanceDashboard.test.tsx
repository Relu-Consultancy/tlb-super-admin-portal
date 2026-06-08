import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinanceDashboard from './FinanceDashboard';

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
    parseAmount: (v: any) => (v == null || v === '' || v === '-' ? null : Number(v)),
    safeCurrency: () => 'INR',
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    STATS_PERIODS: ['today', 'this_week', 'this_month', 'custom'],
    STATS_PERIOD_LABELS: { today: 'Today', this_week: 'This Week', this_month: 'This Month', custom: 'Custom' },
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { getOverviewStats } from '../../shared/lib/api';

const OVERVIEW = {
    period: { type: 'this_month', date_from: '2026-06-01', date_to: '2026-06-30', label: 'This Month' },
    users: { total_customers: 0, total_partners: 0, new_customers: 0, new_partners: 0 },
    listings: { total: 0, published: 0, pending_moderation: 0, rejected: 0, draft: 0, by_type: {} },
    bookings: { total: 540, confirmed: 500, cancelled: 0, refunded: 10, pending: 0, attended: 0 },
    revenue: { gross: '500000', refunds: '8000', net: '460000', platform_fees: '32000', avg_order_value: '925', currency: 'INR' },
    support: { open: 0, in_progress: 0, resolved_in_period: 0, total_open: 0 },
    trend: [{ date: '2026-06-01', bookings: 10, revenue: '9000', signups: 5 }],
    recent_activity: { bookings: [], signups: [], tickets: [] },
};

describe('FinanceDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getOverviewStats as any).mockResolvedValue(OVERVIEW);
    });

    it('renders the heading and loads overview stats', async () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
        await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith({ period: 'this_month' }));
    });

    it('shows real revenue KPIs from the stats API', async () => {
        render(<FinanceDashboard />);
        expect(await screen.findByText('Gross Revenue')).toBeInTheDocument();
        expect(screen.getByText('Net Revenue')).toBeInTheDocument();
        expect(screen.getByText((t) => t.replace(/,/g, '').includes('460000'))).toBeInTheDocument(); // net revenue
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('re-fetches when the period changes', async () => {
        render(<FinanceDashboard />);
        await screen.findByText('Gross Revenue');
        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        await waitFor(() => expect(getOverviewStats).toHaveBeenCalledWith({ period: 'today' }));
    });

    it('shows an error state when the API fails', async () => {
        (getOverviewStats as any).mockRejectedValue(new Error('boom'));
        render(<FinanceDashboard />);
        expect(await screen.findByText("Couldn't load finance data")).toBeInTheDocument();
    });
});
