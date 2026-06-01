import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FinanceDashboard from './FinanceDashboard';

// Recharts uses SVG which jsdom doesn't fully support; mock the relevant components
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
}));

describe('FinanceDashboard', () => {
    it('renders the Finance Dashboard heading', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
    });

    it('renders the sub-heading', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Revenue flow and payout tracking')).toBeInTheDocument();
    });

    it('renders Total GMV stat card', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Total GMV')).toBeInTheDocument();
    });

    it('renders Platform Revenue stat card', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Platform Revenue')).toBeInTheDocument();
    });

    it('shows an empty state for the revenue chart when there is no data', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('No revenue data yet')).toBeInTheDocument();
    });

    it('renders Pending Payouts stat card', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Pending Payouts')).toBeInTheDocument();
    });

    it('renders Refund Rate stat card', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Refund Rate')).toBeInTheDocument();
    });

    it('renders Revenue Inflow vs Outflow chart section', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Revenue Inflow vs Outflow')).toBeInTheDocument();
    });

    it('renders Payout Status section', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Payout Status')).toBeInTheDocument();
        expect(screen.getByText('Verified Partners')).toBeInTheDocument();
        expect(screen.getByText('Pending Verification')).toBeInTheDocument();
        expect(screen.getByText('Disputed Payments')).toBeInTheDocument();
    });

    it('renders Process All Payouts button', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Process All Payouts')).toBeInTheDocument();
    });

    it('renders Monthly View and Generate Report buttons', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Monthly View')).toBeInTheDocument();
        expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });
});
