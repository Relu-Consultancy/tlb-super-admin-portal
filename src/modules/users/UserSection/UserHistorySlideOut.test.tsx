import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserHistorySlideOut from './UserHistorySlideOut';

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockUser = {
    id: '#TLB-U-9082',
    email: 'trushna@tlb.com',
    role: 'customer',
    auth_provider: 'otp',
    is_active: true,
    is_verified: true,
    disabled_reason: '',
    disabled_at: null,
    last_login: '2026-06-01T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
};

describe('UserHistorySlideOut', () => {
    it('renders the Activity Ledger heading with the customer email', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText(/Activity Ledger: trushna@tlb.com/)).toBeInTheDocument();
    });

    it('renders the user ID', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        // Appears in the header and the Account tab's User ID field.
        expect(screen.getAllByText('#TLB-U-9082').length).toBeGreaterThan(0);
    });

    it('renders all four tabs', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText('Account & Security')).toBeInTheDocument();
        expect(screen.getByText('Bookings & Enquiries')).toBeInTheDocument();
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
        expect(screen.getByText('Followed Partners')).toBeInTheDocument();
    });

    it('shows real account fields on the Account tab by default', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText('trushna@tlb.com')).toBeInTheDocument();
        expect(screen.getByText('Account Status')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows "Not available yet" for the rich-history tabs', async () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        await userEvent.click(screen.getByText('Bookings & Enquiries'));
        expect(screen.getByText('Not available yet')).toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked', async () => {
        const onClose = vi.fn();
        render(<UserHistorySlideOut user={mockUser} onClose={onClose} />);
        await userEvent.click(screen.getAllByRole('button')[0]);
        expect(onClose).toHaveBeenCalled();
    });

    it('does not render when user is null', () => {
        render(<UserHistorySlideOut user={null} onClose={vi.fn()} />);
        expect(screen.queryByText(/Activity Ledger/)).not.toBeInTheDocument();
    });
});
