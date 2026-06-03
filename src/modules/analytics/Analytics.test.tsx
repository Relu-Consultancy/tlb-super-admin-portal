import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Analytics', () => {
    it('renders the Analytics Overview heading', () => {
        render(<Analytics />);
        expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    });

    it('renders the sub-heading', () => {
        render(<Analytics />);
        expect(screen.getByText('Super Admin Portal')).toBeInTheDocument();
    });

    it('renders the stat card labels', () => {
        render(<Analytics />);
        expect(screen.getByText('Current Bookings')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
    });

    it('renders Daily Bookings chart section', () => {
        render(<Analytics />);
        expect(screen.getByText('Daily Bookings')).toBeInTheDocument();
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    });

    it('shows empty states for the chart sections when there is no data', () => {
        render(<Analytics />);
        expect(screen.getByText('No booking data yet')).toBeInTheDocument();
        expect(screen.getByText('No revenue data yet')).toBeInTheDocument();
        expect(screen.getByText('No event data yet')).toBeInTheDocument();
    });

    it('renders Revenue by Category section', () => {
        render(<Analytics />);
        expect(screen.getByText('Revenue by Category')).toBeInTheDocument();
    });

    it('renders Top 5 Events section', () => {
        render(<Analytics />);
        expect(screen.getByText('Top 5 Events')).toBeInTheDocument();
    });

    it('renders Booking Status section with status labels', () => {
        render(<Analytics />);
        expect(screen.getByText('Booking Status')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('renders PDF and Excel export buttons', () => {
        render(<Analytics />);
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
    });
});
