import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserHistorySlideOut from './UserHistorySlideOut';

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockUser = {
    id: '#TLB-U-9082',
    name: 'Trushna',
    email: 'trushna@tlb.com',
};

describe('UserHistorySlideOut', () => {
    it('renders the Activity Ledger heading with user name', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText(/Activity Ledger: Trushna/)).toBeInTheDocument();
    });

    it('renders the user ID', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText('#TLB-U-9082')).toBeInTheDocument();
    });

    it('renders all four tabs', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText('Bookings & Enquiries')).toBeInTheDocument();
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
        expect(screen.getByText('Followed Partners')).toBeInTheDocument();
        expect(screen.getByText('Security & Controls')).toBeInTheDocument();
    });

    it('renders bookings table by default', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        // Column headers from the bookings tab
        expect(screen.getByText('Ref ID & Date')).toBeInTheDocument();
        expect(screen.getByText('TLB Net')).toBeInTheDocument();
    });

    it('shows an empty state in the bookings tab when there is no data', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        expect(screen.getByText('No bookings or enquiries')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<UserHistorySlideOut user={mockUser} onClose={onClose} />);
        // The X button in the header
        const closeButtons = screen.getAllByRole('button');
        fireEvent.click(closeButtons[0]);
        expect(onClose).toHaveBeenCalled();
    });

    it('switches to Reviews & Ratings tab when clicked', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Reviews & Ratings'));
        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });

    it('switches to Security & Controls tab when clicked', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Security & Controls'));
        expect(screen.getByText('Login ID')).toBeInTheDocument();
        expect(screen.getByText('Device Sessions')).toBeInTheDocument();
        expect(screen.getByText('Suspend Account')).toBeInTheDocument();
    });

    it('shows email in the security tab', () => {
        render(<UserHistorySlideOut user={mockUser} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Security & Controls'));
        expect(screen.getByText('trushna@tlb.com')).toBeInTheDocument();
    });

    it('does not render when user is null', () => {
        render(<UserHistorySlideOut user={null} onClose={vi.fn()} />);
        expect(screen.queryByText(/Activity Ledger/)).not.toBeInTheDocument();
    });
});
