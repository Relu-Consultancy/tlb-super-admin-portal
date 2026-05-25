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

    it('renders Current Bookings stat card', () => {
        render(<Analytics />);
        expect(screen.getByText('Current Bookings')).toBeInTheDocument();
        expect(screen.getByText('1,248')).toBeInTheDocument();
    });

    it('renders Total Revenue stat card', () => {
        render(<Analytics />);
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$45,200')).toBeInTheDocument();
    });

    it('renders Active Users stat card', () => {
        render(<Analytics />);
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('856')).toBeInTheDocument();
    });

    it('renders Daily Bookings chart section', () => {
        render(<Analytics />);
        expect(screen.getByText('Daily Bookings')).toBeInTheDocument();
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    });

    it('renders Revenue by Category section', () => {
        render(<Analytics />);
        expect(screen.getByText('Revenue by Category')).toBeInTheDocument();
        // Legend items from mock data
        expect(screen.getByText('Music')).toBeInTheDocument();
        expect(screen.getByText('Tech')).toBeInTheDocument();
    });

    it('renders Top 5 Events section with mock data', () => {
        render(<Analytics />);
        expect(screen.getByText('Top 5 Events')).toBeInTheDocument();
        expect(screen.getByText('Summer Music Fest')).toBeInTheDocument();
        expect(screen.getByText('Tech Summit 2023')).toBeInTheDocument();
    });

    it('renders Booking Status section', () => {
        render(<Analytics />);
        expect(screen.getByText('Booking Status')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('842')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('312')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
        expect(screen.getByText('94')).toBeInTheDocument();
    });

    it('renders PDF and Excel export buttons', () => {
        render(<Analytics />);
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
    });
});
