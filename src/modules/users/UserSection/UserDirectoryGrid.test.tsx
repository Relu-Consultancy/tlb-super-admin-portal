import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserDirectoryGrid from './UserDirectoryGrid';

// The component accesses nested fields (revenueBreakdown.tickets) not present in base mockData.
// Provide correctly-shaped data via module mock.
vi.mock('../../../data/mockData', () => ({
    USER_SECTION_USERS: [
        {
            id: '#TLB-U-9082',
            name: 'Trushna',
            avatar: 'https://example.com/avatar.jpg',
            joinDate: '12-Apr-26',
            email: 'trushna@tlb.com',
            phone: '+91 9819X XXXXX',
            location: 'Mumbai',
            totalRevenue: 24000,
            revenueBreakdown: { tickets: 80, inquiries: 20 },
            totalBookings: 12,
            totalInquiries: 4,
            lastActive: '01-May-26',
            accountStatus: 'Active',
        },
        {
            id: '#TLB-U-9083',
            name: 'Rahul Sharma',
            avatar: 'https://example.com/avatar2.jpg',
            joinDate: '10-May-26',
            email: 'rahul.s@gmail.com',
            phone: '+91 9820X XXXXX',
            location: 'Delhi',
            totalRevenue: 1500,
            revenueBreakdown: { tickets: 60, inquiries: 40 },
            totalBookings: 3,
            totalInquiries: 2,
            lastActive: '20-May-26',
            accountStatus: 'Inactive',
        },
    ],
}));

describe('UserDirectoryGrid', () => {
    const mockOpenHistory = vi.fn();

    it('renders the ZONE 2 heading', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText(/ZONE 2: Master User Directory/)).toBeInTheDocument();
    });

    it('renders the search input', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByPlaceholderText(/Type Name, User ID/)).toBeInTheDocument();
    });

    it('renders the Export CSV button', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('renders the More Filters button', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('More Filters')).toBeInTheDocument();
    });

    it('renders table column headers', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('User Details')).toBeInTheDocument();
        expect(screen.getByText('Contact & Location')).toBeInTheDocument();
        expect(screen.getByText('Financial Summary')).toBeInTheDocument();
        expect(screen.getByText('Platform Activity')).toBeInTheDocument();
        expect(screen.getByText('Account Status')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders user names from mock data', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('Trushna')).toBeInTheDocument();
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    });

    it('renders View History buttons for each user', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        const historyButtons = screen.getAllByText('View History');
        expect(historyButtons.length).toBe(2);
    });

    it('calls onOpenHistory when View History is clicked', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        const historyButtons = screen.getAllByText('View History');
        fireEvent.click(historyButtons[0]);
        expect(mockOpenHistory).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Trushna' })
        );
    });

    it('renders revenue tiers dropdown', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('All Revenue Tiers')).toBeInTheDocument();
    });

    it('renders account status dropdown', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('All Account Status')).toBeInTheDocument();
    });
});
