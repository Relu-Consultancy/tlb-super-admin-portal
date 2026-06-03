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

vi.mock('../../shared/lib/api', () => ({
    getPartnerMetrics: vi.fn(() => Promise.resolve({
        total_partners: 9, approved: 5, under_review: 3, rejected: 1,
        activated_limited: 0, profile_created: 0, is_active_count: 7, is_verified_count: 6, new_this_month: 2,
    })),
    getUserMetrics: vi.fn(() => Promise.resolve({
        total_users: 40, active_users: 35, inactive_users: 5, deleted_users: 0,
        new_today: 1, new_this_week: 4, new_this_month: 12, by_auth_provider: { otp: 30, google: 10 },
    })),
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

    it('renders the partner/user stat cards', async () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Total Partners')).toBeInTheDocument();
        expect(screen.getByText('Payout-Ready Partners')).toBeInTheDocument();
        expect(screen.getAllByText('Pending Verification').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('fills stat cards with values from the existing metrics APIs', async () => {
        render(<FinanceDashboard />);
        expect(await screen.findByText('9')).toBeInTheDocument(); // total partners
        expect(screen.getByText('6')).toBeInTheDocument(); // payout-ready (verified)
        expect(screen.getByText('40')).toBeInTheDocument(); // total users
    });

    it('shows an empty state for the revenue chart when there is no data', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('No revenue data yet')).toBeInTheDocument();
    });

    it('renders Revenue Inflow vs Outflow chart section', () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Revenue Inflow vs Outflow')).toBeInTheDocument();
    });

    it('renders Payout Status section with partner counts', async () => {
        render(<FinanceDashboard />);
        expect(screen.getByText('Payout Status')).toBeInTheDocument();
        expect(screen.getByText('Verified Partners')).toBeInTheDocument();
        // "Pending Verification" appears both as a stat card and a payout row.
        expect(screen.getAllByText('Pending Verification').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Rejected Partners')).toBeInTheDocument();
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
