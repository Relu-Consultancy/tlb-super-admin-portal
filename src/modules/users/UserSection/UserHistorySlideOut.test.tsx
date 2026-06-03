import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserHistorySlideOut from './UserHistorySlideOut';

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const { authState } = vi.hoisted(() => ({ authState: { canManage: true } }));
vi.mock('../../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: () => authState.canManage }),
}));

vi.mock('../../../shared/lib/api', () => ({
    getUser: vi.fn(() => Promise.resolve({ id: '#TLB-U-9082', email: 'trushna@tlb.com', phone: '999', role: 'customer', is_active: true, disabled_reason: '' })),
    getUserLoginHistory: vi.fn(() => Promise.resolve([])),
    getUserSecurityLog: vi.fn(() => Promise.resolve([])),
    getUserBookings: vi.fn(() => Promise.resolve([
        { id: 'b-1', booking_reference: 'BK-1', booking_type: 'event', status: 'confirmed', payment_status: 'paid', total_amount: '500', platform_fee: '10', currency: 'INR', cancelled_at: null, cancellation_reason: null, refund_amount: null, created_at: '2026-06-01T00:00:00Z', listing: { id: 'l1', title: 'Pottery Class', listing_type: 'class' }, line_items: [] },
    ])),
    getUserReviews: vi.fn(() => Promise.resolve([])),
    getUserWishlist: vi.fn(() => Promise.resolve([])),
    disableUser: vi.fn(() => Promise.resolve({ detail: 'disabled' })),
    enableUser: vi.fn(() => Promise.resolve({ detail: 'enabled' })),
    forceLogoutUser: vi.fn(() => Promise.resolve({ detail: 'logged out' })),
    resetUserOtp: vi.fn(() => Promise.resolve({ detail: 'otp sent' })),
    formatMoney: (a: any) => `₹${a}`,
    humanizeKey: (k: string) => k,
    userDisplayName: (u: any) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { getUserBookings, forceLogoutUser } from '../../../shared/lib/api';

const mockUser = {
    id: '#TLB-U-9082',
    email: 'trushna@tlb.com',
    first_name: 'Trushna',
    last_name: '',
    auth_provider: 'otp',
    is_active: true,
    is_verified: true,
    is_profile_complete: true,
    phone: '999',
    disabled_at: null,
    last_login: '2026-06-01T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    booking_stats: {},
};

describe('UserHistorySlideOut', () => {
    beforeEach(() => { vi.clearAllMocks(); authState.canManage = true; });

    it('renders the Activity Ledger heading with the customer email', () => {
        render(<UserHistorySlideOut user={mockUser as any} onClose={vi.fn()} />);
        expect(screen.getByText(/Activity Ledger: Trushna/)).toBeInTheDocument();
        expect(screen.getAllByText('trushna@tlb.com').length).toBeGreaterThan(0);
    });

    it('renders all four tabs', () => {
        render(<UserHistorySlideOut user={mockUser as any} onClose={vi.fn()} />);
        expect(screen.getByText('Account & Security')).toBeInTheDocument();
        expect(screen.getByText('Bookings')).toBeInTheDocument();
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
        expect(screen.getByText('Wishlist')).toBeInTheDocument();
    });

    it('shows real account fields on the Account tab by default', () => {
        render(<UserHistorySlideOut user={mockUser as any} onClose={vi.fn()} />);
        expect(screen.getByText('Account Status')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('loads bookings from the API when the Bookings tab is opened', async () => {
        render(<UserHistorySlideOut user={mockUser as any} onClose={vi.fn()} />);
        await userEvent.click(screen.getByText('Bookings'));
        await waitFor(() => expect(getUserBookings).toHaveBeenCalledWith('#TLB-U-9082'));
        expect(await screen.findByText('Pottery Class')).toBeInTheDocument();
    });

    it('runs a force-logout security action and notifies the parent', async () => {
        const onChanged = vi.fn();
        render(<UserHistorySlideOut user={mockUser as any} onClose={vi.fn()} onChanged={onChanged} />);
        await userEvent.click(await screen.findByRole('button', { name: /Force Logout/i }));
        await waitFor(() => expect(forceLogoutUser).toHaveBeenCalledWith('#TLB-U-9082'));
        await waitFor(() => expect(onChanged).toHaveBeenCalled());
    });

    it('hides security actions without MANAGE_CUSTOMERS', () => {
        authState.canManage = false;
        render(<UserHistorySlideOut user={mockUser as any} onClose={vi.fn()} />);
        expect(screen.queryByText('Security Actions')).not.toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked', async () => {
        const onClose = vi.fn();
        render(<UserHistorySlideOut user={mockUser as any} onClose={onClose} />);
        await userEvent.click(screen.getAllByRole('button')[0]);
        expect(onClose).toHaveBeenCalled();
    });

    it('does not render when user is null', () => {
        render(<UserHistorySlideOut user={null} onClose={vi.fn()} />);
        expect(screen.queryByText(/Activity Ledger/)).not.toBeInTheDocument();
    });
});
