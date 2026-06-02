import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDirectoryGrid from './UserDirectoryGrid';

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
vi.mock('../../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: () => authState.canManage }),
}));

vi.mock('../../../shared/lib/api', () => ({
    listCustomers: vi.fn(),
    disableCustomer: vi.fn(() => Promise.resolve({ detail: 'disabled' })),
    enableCustomer: vi.fn(() => Promise.resolve({ detail: 'enabled' })),
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listCustomers, disableCustomer } from '../../../shared/lib/api';

const CUSTOMERS = [
    { id: 'u-1', email: 'active@tlb.com', role: 'customer', auth_provider: 'otp', is_active: true, is_verified: true, disabled_reason: '', disabled_at: null, last_login: '2026-06-01T10:00:00Z', created_at: '2026-01-01T00:00:00Z' },
    { id: 'u-2', email: 'disabled@tlb.com', role: 'customer', auth_provider: 'email', is_active: false, is_verified: false, disabled_reason: 'Spam', disabled_at: '2026-05-01T00:00:00Z', last_login: null, created_at: '2026-01-01T00:00:00Z' },
];

describe('UserDirectoryGrid', () => {
    const onOpenHistory = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        authState.canManage = true;
        (listCustomers as any).mockResolvedValue({ count: 2, next: null, previous: null, results: CUSTOMERS });
    });

    it('renders the ZONE 2 heading and search', () => {
        render(<UserDirectoryGrid onOpenHistory={onOpenHistory} />);
        expect(screen.getByText(/ZONE 2: Master User Directory/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search by email...')).toBeInTheDocument();
    });

    it('lists customers fetched from the API', async () => {
        render(<UserDirectoryGrid onOpenHistory={onOpenHistory} />);
        expect(await screen.findByText('active@tlb.com')).toBeInTheDocument();
        expect(screen.getByText('disabled@tlb.com')).toBeInTheDocument();
    });

    it('calls onOpenHistory when View History is clicked', async () => {
        render(<UserDirectoryGrid onOpenHistory={onOpenHistory} />);
        await screen.findByText('active@tlb.com');
        await userEvent.click(screen.getAllByText('View History')[0]);
        expect(onOpenHistory).toHaveBeenCalledWith(expect.objectContaining({ email: 'active@tlb.com' }));
    });

    it('opens the disable modal and submits a reason', async () => {
        render(<UserDirectoryGrid onOpenHistory={onOpenHistory} />);
        await screen.findByText('active@tlb.com');
        await userEvent.click(screen.getByTitle('Disable account'));
        expect(await screen.findByText('Disable Customer')).toBeInTheDocument();
        await userEvent.type(screen.getByPlaceholderText(/Policy violation/i), 'Spamming');
        await userEvent.click(screen.getByRole('button', { name: 'Disable Account' }));
        await waitFor(() => expect(disableCustomer).toHaveBeenCalledWith('u-1', 'Spamming'));
    });

    it('hides disable/enable without MANAGE_CUSTOMERS', async () => {
        authState.canManage = false;
        render(<UserDirectoryGrid onOpenHistory={onOpenHistory} />);
        await screen.findByText('active@tlb.com');
        expect(screen.queryByTitle('Disable account')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Enable account')).not.toBeInTheDocument();
    });
});
