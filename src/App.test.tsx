import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock recharts used by Analytics and FinanceDashboard modules
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => <div>{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: () => null,
    Cell: () => null,
}));

vi.mock('motion/react', async () => {
    const React = await import('react');
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                return ({ children, ...props }: any) => {
                    const { initial, animate, exit, transition, layoutId, ...rest } = props;
                    return React.createElement(tag as any, rest, children);
                };
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

describe('App', () => {
    it('renders the login screen heading when not logged in', () => {
        render(<App />);
        expect(screen.getByText('TLB Admin Team')).toBeInTheDocument();
    });

    it('shows the email input on the login screen', () => {
        render(<App />);
        expect(screen.getByPlaceholderText('name@tlb-events.com')).toBeInTheDocument();
    });

    it('shows the password input on the login screen', () => {
        render(<App />);
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('logs in and shows the main app layout', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Login'));
        // After login the dashboard should be visible
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('shows the admin name in the header after login', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Login'));
        expect(screen.getByText('Vishesh S.')).toBeInTheDocument();
    });

    it('shows the Super Admin role label after login', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Login'));
        // "Super Admin" appears in the header
        const superAdminLabels = screen.getAllByText('Super Admin');
        expect(superAdminLabels.length).toBeGreaterThan(0);
    });

    it('shows the sidebar with nav items after login', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Login'));
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Partner Management')).toBeInTheDocument();
    });

    it('shows login screen sub-heading', () => {
        render(<App />);
        expect(screen.getByText('Secure access for super admins')).toBeInTheDocument();
    });
});
