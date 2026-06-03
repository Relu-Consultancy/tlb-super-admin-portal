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
        // Dashboard (default authenticated screen) pulls these on mount.
        getPartnerMetrics: vi.fn(() => Promise.resolve({
            total_partners: 0, approved: 0, under_review: 0, rejected: 0,
            activated_limited: 0, profile_created: 0, is_active_count: 0, is_verified_count: 0, new_this_month: 0,
        })),
        getUserMetrics: vi.fn(() => Promise.resolve({
            total_users: 0, active_users: 0, inactive_users: 0, deleted_users: 0,
            new_today: 0, new_this_week: 0, new_this_month: 0, by_auth_provider: { otp: 0, google: 0 },
        })),
    },
}));
vi.mock('./shared/lib/api', () => ({
    ...apiMock,
    SESSION_EXPIRED_EVENT: 'auth:expired',
    roleLabel: (r: string) => (r === 'SUPER_ADMIN' ? 'Super Admin' : r),
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

    it('logs in and shows the main app layout', async () => {
        renderApp();
        await loginThroughFlow();
        expect(await screen.findByText('Dashboard')).toBeInTheDocument();
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

    it('shows the sidebar with nav items after login', async () => {
        renderApp();
        await loginThroughFlow();
        expect(await screen.findByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Partner Management')).toBeInTheDocument();
    });
});
