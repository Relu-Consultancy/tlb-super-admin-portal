import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from './UserManagement';

vi.mock('motion/react', async () => {
    const React = await import('react');
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

const { authState } = vi.hoisted(() => ({ authState: { canManage: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: () => authState.canManage }),
}));

vi.mock('../../shared/lib/api', () => ({
    listUsersPaginated: vi.fn(),
    listUsers: vi.fn(),
    getUser: vi.fn((id: string) => Promise.resolve({
        id, email: 'active@tlb.com', phone: '999', role: 'customer', auth_provider: 'otp',
        is_active: true, is_verified: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
        last_login: '2026-06-01T10:00:00Z', forced_logout_at: null, disabled_at: null, disabled_reason: null, deleted_at: null,
        customer_profile: {}, booking_summary: {},
    })),
    getUserMetrics: vi.fn(() => Promise.resolve({
        total_users: 8, active_users: 5, inactive_users: 3, deleted_users: 0,
        enabled_users: 9, disabled_users: 10,
        new_today: 1, new_this_week: 2, new_this_month: 4, by_auth_provider: { otp: 6, google: 2 },
    })),
    getUserLoginHistory: vi.fn(() => Promise.resolve([])),
    getUserSecurityLog: vi.fn(() => Promise.resolve([])),
    disableUser: vi.fn(() => Promise.resolve({ detail: 'disabled' })),
    enableUser: vi.fn(() => Promise.resolve({ detail: 'enabled' })),
    forceLogoutUser: vi.fn(() => Promise.resolve({ detail: 'logged out' })),
    resetUserOtp: vi.fn(() => Promise.resolve({ detail: 'otp sent' })),
    queueUserExport: vi.fn(() => Promise.resolve({ job_id: 'j1', status: 'done' })),
    getUserExportJob: vi.fn(() => Promise.resolve({ job_id: 'j1', status: 'done' })),
    downloadUserExport: vi.fn(() => Promise.resolve(new Blob(['csv']))),
    userDisplayName: (u: any) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
    pickStat: (s: any, ...keys: string[]) => { for (const k of keys) if (s && s[k] != null) return s[k]; return undefined; },
    formatMoney: (a: any) => `₹${a}`,
    humanizeKey: (k: string) => k,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listUsersPaginated, disableUser } from '../../shared/lib/api';

const USERS = [
    { id: 'u-1', email: 'active@tlb.com', first_name: 'Ann', last_name: 'A', phone: '1', auth_provider: 'otp', is_active: true, is_verified: true, is_profile_complete: true, disabled_at: null, last_login: '2026-06-01T10:00:00Z', created_at: '2026-01-01T00:00:00Z', booking_stats: { total_bookings: 7, total_spend: 1500 } },
    { id: 'u-2', email: 'disabled@tlb.com', first_name: 'Bob', last_name: 'B', phone: null, auth_provider: 'google', is_active: false, is_verified: false, is_profile_complete: false, disabled_at: '2026-05-01T00:00:00Z', last_login: null, created_at: '2026-01-01T00:00:00Z', booking_stats: {} },
];

describe('UserManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.canManage = true;
        (listUsersPaginated as any).mockResolvedValue({ count: 2, next: null, previous: null, results: USERS });
    });

    it('renders heading and metrics', async () => {
        render(<UserManagement />);
        expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument();
        expect(await screen.findByText('Total Customers')).toBeInTheDocument();
        expect(await screen.findByText('8')).toBeInTheDocument();
    });

    it('lists users with booking stats', async () => {
        render(<UserManagement />);
        expect(await screen.findByText('active@tlb.com')).toBeInTheDocument();
        expect(screen.getByText('disabled@tlb.com')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument(); // total bookings
    });

    it('shows an empty state when no users match', async () => {
        (listUsersPaginated as any).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        render(<UserManagement />);
        expect(await screen.findByText('No users found')).toBeInTheDocument();
    });

    it('opens the disable modal and submits a reason', async () => {
        render(<UserManagement />);
        await screen.findByText('active@tlb.com');
        await userEvent.click(screen.getByTitle('Disable account'));
        expect(await screen.findByText('Disable Customer')).toBeInTheDocument();
        await userEvent.type(screen.getByPlaceholderText(/Policy violation/i), 'Spamming');
        await userEvent.click(screen.getByRole('button', { name: 'Disable Account' }));
        await waitFor(() => expect(disableUser).toHaveBeenCalledWith('u-1', 'Spamming'));
    });

    it('hides disable/enable without MANAGE_CUSTOMERS', async () => {
        authState.canManage = false;
        render(<UserManagement />);
        await screen.findByText('active@tlb.com');
        expect(screen.queryByTitle('Disable account')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Enable account')).not.toBeInTheDocument();
    });

    it('opens the detail slide-over with account info', async () => {
        render(<UserManagement />);
        await userEvent.click(await screen.findByText('active@tlb.com'));
        expect(await screen.findByText('Account & Security')).toBeInTheDocument();
        expect(screen.getByText('Recent Logins')).toBeInTheDocument();
    });

    it('changes page size via the Show selector and re-fetches page 1', async () => {
        render(<UserManagement />);
        await screen.findByText('active@tlb.com');
        expect(listUsersPaginated).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 10 }));

        await userEvent.click(screen.getByRole('button', { name: '10' }));
        await userEvent.click(await screen.findByText('25'));

        await waitFor(() => expect(listUsersPaginated).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 25 })));
    });
});
