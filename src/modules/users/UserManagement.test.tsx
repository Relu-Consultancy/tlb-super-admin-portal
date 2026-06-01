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
    listCustomers: vi.fn(),
    getCustomer: vi.fn((id: string) => Promise.resolve({ id })),
    disableCustomer: vi.fn(() => Promise.resolve({ detail: 'disabled' })),
    enableCustomer: vi.fn(() => Promise.resolve({ detail: 'enabled' })),
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listCustomers, disableCustomer } from '../../shared/lib/api';

const CUSTOMERS = [
    { id: 'u-1', email: 'active@tlb.com', role: 'customer', auth_provider: 'otp', is_active: true, is_verified: true, disabled_reason: '', disabled_at: null, last_login: '2026-06-01T10:00:00Z', created_at: '2026-01-01T00:00:00Z' },
    { id: 'u-2', email: 'disabled@tlb.com', role: 'customer', auth_provider: 'email', is_active: false, is_verified: false, disabled_reason: 'Spam', disabled_at: '2026-05-01T00:00:00Z', last_login: null, created_at: '2026-01-01T00:00:00Z' },
];

describe('UserManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.canManage = true;
        (listCustomers as any).mockResolvedValue({ count: 2, next: null, previous: null, results: CUSTOMERS });
    });

    it('renders the heading and search', () => {
        render(<UserManagement />);
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search by email...')).toBeInTheDocument();
    });

    it('renders customer rows fetched from the API', async () => {
        render(<UserManagement />);
        expect(await screen.findByText('active@tlb.com')).toBeInTheDocument();
        expect(screen.getByText('disabled@tlb.com')).toBeInTheDocument();
    });

    it('shows Active and Disabled status badges', async () => {
        render(<UserManagement />);
        await screen.findByText('active@tlb.com');
        // Each label appears as a row badge plus the filter dropdown option.
        expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Disabled').length).toBeGreaterThanOrEqual(2);
    });

    it('shows an empty state when no customers match', async () => {
        (listCustomers as any).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        render(<UserManagement />);
        expect(await screen.findByText('No users found')).toBeInTheDocument();
    });

    it('opens the disable modal and submits a reason', async () => {
        render(<UserManagement />);
        await screen.findByText('active@tlb.com');
        // The active row's disable (Ban) button
        await userEvent.click(screen.getByTitle('Disable account'));
        expect(await screen.findByText('Disable Customer')).toBeInTheDocument();
        await userEvent.type(screen.getByPlaceholderText(/Policy violation/i), 'Spamming');
        await userEvent.click(screen.getByRole('button', { name: 'Disable Account' }));
        await waitFor(() => expect(disableCustomer).toHaveBeenCalledWith('u-1', 'Spamming'));
    });

    it('hides disable/enable actions without MANAGE_CUSTOMERS', async () => {
        authState.canManage = false;
        render(<UserManagement />);
        await screen.findByText('active@tlb.com');
        expect(screen.queryByTitle('Disable account')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Enable account')).not.toBeInTheDocument();
    });
});
