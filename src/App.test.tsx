import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthProvider } from './shared/auth/AuthContext';

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
    // Cache component per tag so references stay stable across re-renders.
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                if (!cache[tag]) {
                    cache[tag] = ({ children, ...props }: any) => {
                        const { initial, animate, exit, transition, layoutId, ...rest } = props;
                        return React.createElement(tag as any, rest, children);
                    };
                }
                return cache[tag];
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

// Mock the API layer so the AuthProvider resolves instantly and starts logged-out.
const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        login: vi.fn(() => Promise.resolve({})),
        logout: vi.fn(() => Promise.resolve()),
        getProfile: vi.fn(() =>
            Promise.resolve({
                full_name: 'Vishesh S.',
                email: 'admin@tlb-events.com',
                role: 'SUPER_ADMIN',
                effective_permissions: [],
            }),
        ),
        hasSession: vi.fn(() => false),
        // Dashboard (default authenticated screen) pulls overview stats on mount.
        getOverviewStats: vi.fn(() => Promise.resolve({
            period: { type: 'this_month', date_from: '', date_to: '', label: 'This Month' },
            users: { total_customers: 0, total_partners: 0, new_customers: 0, new_partners: 0 },
            listings: { total: 0, published: 0, pending_moderation: 0, rejected: 0, draft: 0, by_type: {} },
            bookings: { total: 0, confirmed: 0, cancelled: 0, refunded: 0, pending: 0, attended: 0 },
            revenue: { gross: '0', refunds: '0', net: '0', platform_fees: '0', avg_order_value: '0', currency: 'INR' },
            support: { open: 0, in_progress: 0, resolved_in_period: 0, total_open: 0 },
            trend: [],
            recent_activity: { bookings: [], signups: [], tickets: [] },
        })),
    },
}));
vi.mock('./shared/lib/api', () => ({
    ...apiMock,
    SESSION_EXPIRED_EVENT: 'auth:expired',
    roleLabel: (r: string) => (r === 'SUPER_ADMIN' ? 'Super Admin' : r),
    // Stats helpers/constants the Dashboard imports.
    parseAmount: (v: any) => (v == null || v === '' || v === '-' ? null : Number(v)),
    safeCurrency: () => 'INR',
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    STATS_PERIODS: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'custom'],
    STATS_PERIOD_LABELS: { today: 'Today', yesterday: 'Yesterday', this_week: 'This Week', last_week: 'Last Week', this_month: 'This Month', custom: 'Custom Range' },
    ApiError: class ApiError extends Error {},
}));

const renderApp = () => render(
    <AuthProvider>
        <App />
    </AuthProvider>,
);

/** Navigate landing -> login -> submit valid credentials. */
async function loginThroughFlow() {
    await userEvent.click(await screen.findByRole('button', { name: /login to dashboard/i }));
    await userEvent.type(await screen.findByPlaceholderText('name@tlb-events.com'), 'admin@tlb-events.com');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
}

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiMock.hasSession.mockReturnValue(false);
    });

    it('renders the landing page first when not logged in', async () => {
        renderApp();
        expect(await screen.findByText(/command center for/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login to dashboard/i })).toBeInTheDocument();
    });

    it('navigates from landing to the login screen', async () => {
        renderApp();
        await userEvent.click(await screen.findByRole('button', { name: /login to dashboard/i }));
        expect(await screen.findByText('TLB Admin Team')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@tlb-events.com')).toBeInTheDocument();
    });

    it('can go back from login to the landing page', async () => {
        renderApp();
        await userEvent.click(await screen.findByRole('button', { name: /login to dashboard/i }));
        await userEvent.click(await screen.findByRole('button', { name: /^back$/i }));
        expect(await screen.findByText(/command center for/i)).toBeInTheDocument();
    });

    // Skipped: App.tsx now always resets currentScreen to Screen.DASHBOARD on login
    // ("Always land on Dashboard whenever a session becomes authenticated"), and no
    // nav element sets Screen.HOME anymore, so the post-login Hub landing this test
    // asserts is currently unreachable in the app. Pending a product decision on
    // whether to retire Hub.tsx or restore a way to navigate to it.
    it.skip('logs in and lands on the Home hub', async () => {
        renderApp();
        await loginThroughFlow();
        expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
        expect(apiMock.login).toHaveBeenCalledWith('admin@tlb-events.com', 'secret123');
    });

    it('shows the admin name from the profile in the header after login', async () => {
        renderApp();
        await loginThroughFlow();
        expect(await screen.findByText('Vishesh S.')).toBeInTheDocument();
    });

    it('shows the role label in the header after login', async () => {
        renderApp();
        await loginThroughFlow();
        await waitFor(() => {
            expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
        });
    });

    // Skipped: same unreachable-Hub reason as above.
    it.skip('shows the workspaces and their features on the hub after login', async () => {
        renderApp();
        await loginThroughFlow();
        await screen.findByText(/Welcome back/i);
        // Workspace label appears in both the sidebar and the hub card.
        expect(screen.getAllByText('User / Customer').length).toBeGreaterThan(0);
        // Features are listed inside their section cards (unique to the hub).
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Partner Management')).toBeInTheDocument();
        expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
    });

    // Skipped: same unreachable-Hub reason as above.
    it.skip('drills into a section and back to the hub', async () => {
        renderApp();
        await loginThroughFlow();
        await screen.findByText(/Welcome back/i);
        // Enter the Admin workspace from the hub (its first screen, Overview, is mocked).
        await userEvent.click(screen.getByText('Open Admin'));
        // Section sidebar now lists Admin items (hub has unmounted).
        expect(await screen.findByText('Employee Admins')).toBeInTheDocument();
        // Back to the hub via Home.
        await userEvent.click(screen.getByText('Home'));
        expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument();
    });

    it('opens the profile menu and logs out from it', async () => {
        renderApp();
        await loginThroughFlow();
        await screen.findByText('Vishesh S.');
        // Profile menu closed initially.
        expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
        await userEvent.click(screen.getByText('Vishesh S.'));
        const logoutBtn = await screen.findByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);
        expect(apiMock.logout).toHaveBeenCalled();
    });

    it('opens the notifications dropdown from the bell', async () => {
        renderApp();
        await loginThroughFlow();
        await screen.findByText('Vishesh S.');
        await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
        expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
    });
});
