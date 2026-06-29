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
    Legend: () => null,
}));

const { authState } = vi.hoisted(() => ({ authState: { view: true, exportPerm: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: (p: string) => (p === 'VIEW_TRANSACTIONS' || p === 'VIEW_REVENUE' ? authState.view : p === 'EXPORT_REPORTS' ? authState.exportPerm : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
    getFinanceSummary: vi.fn(),
    getFinanceDashboard: vi.fn(),
    queueSummaryExport: vi.fn(),
    getSummaryExportJob: vi.fn(),
    downloadSummaryExport: vi.fn(),
    parseAmount: (v: any) => (v == null || v === '' || v === '-' ? null : Number(v)),
    safeCurrency: () => 'INR',
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    FINANCE_PERIODS: ['today', 'this_week', 'this_month', 'custom'],
    FINANCE_PERIOD_LABELS: { today: 'Today', this_week: 'This Week', this_month: 'This Month', custom: 'Custom' },
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { getFinanceSummary, getFinanceDashboard } from '../../shared/lib/api';

const SUMMARY = {
    gross: '500000', refunds: '8000', net_revenue: '460000', commission_earned: '32000',
    payout_liability: '120000', transaction_count: 540, refund_count: 10, avg_transaction_value: '925', currency: 'INR',
};
const DASH = {
    trend: [{ date: '2026-06-01', gross: '9000', net: '8000', refunds: '500' }],
    by_source: { online: '400000', manual: '100000' },
};

describe('FinanceDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.view = true; authState.exportPerm = true;
        (getFinanceSummary as any).mockResolvedValue(SUMMARY);
        (getFinanceDashboard as any).mockResolvedValue(DASH);
    });

    it('blocks access without finance permissions', async () => {
        authState.view = false;
        render(<FinanceDashboard />);
        expect(await screen.findByText('No access')).toBeInTheDocument();
        expect(getFinanceSummary).not.toHaveBeenCalled();
    });

    it('renders the heading and loads the summary', async () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
        await waitFor(() => expect(getFinanceSummary).toHaveBeenCalledWith({ period: 'this_month' }));
        expect(getFinanceDashboard).toHaveBeenCalledWith({ period: 'this_month' });
    });

    it('shows real revenue KPIs from the summary API', async () => {
        render(<FinanceDashboard />);
        expect(await screen.findByText('Gross Revenue')).toBeInTheDocument();
        expect(screen.getByText('Net Revenue')).toBeInTheDocument();
        expect(screen.getByText('Commission Earned')).toBeInTheDocument();
        expect(screen.getByText((t) => t.replace(/,/g, '').includes('460000'))).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('re-fetches when the period changes', async () => {
        render(<FinanceDashboard />);
        await screen.findByText('Gross Revenue');
        await userEvent.click(screen.getByRole('button', { name: 'Today' }));
        await waitFor(() => expect(getFinanceSummary).toHaveBeenCalledWith({ period: 'today' }));
    });

    it('still shows KPIs when the dashboard (trend) call fails', async () => {
        (getFinanceDashboard as any).mockRejectedValue(new Error('boom'));
        render(<FinanceDashboard />);
        expect(await screen.findByText('Gross Revenue')).toBeInTheDocument();
        expect(screen.getByText('No trend data for this period')).toBeInTheDocument();
    });

    it('shows an error state when the summary API fails', async () => {
        (getFinanceSummary as any).mockRejectedValue(new Error('boom'));
        render(<FinanceDashboard />);
        expect(await screen.findByText("Couldn't load finance data")).toBeInTheDocument();
    });
});
