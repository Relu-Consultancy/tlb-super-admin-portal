import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserManagement from './UserManagement';

describe('UserManagement', () => {
    it('renders the User Management heading', () => {
        render(<UserManagement />);
        expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('renders the sub-heading', () => {
        render(<UserManagement />);
        expect(screen.getByText('Manage platform users and their activity')).toBeInTheDocument();
    });

    it('renders the search input', () => {
        render(<UserManagement />);
        expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    it('renders table headers', () => {
        render(<UserManagement />);
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Bookings')).toBeInTheDocument();
        expect(screen.getByText('Total Spent')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders user rows from mock data', () => {
        render(<UserManagement />);
        const rows = screen.getAllByRole('row');
        // header row + at least one data row
        expect(rows.length).toBeGreaterThan(1);
    });

    it('renders user names from mock data', () => {
        render(<UserManagement />);
        expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
        expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
        expect(screen.getByText('Michael Brown')).toBeInTheDocument();
    });

    it('renders user emails from mock data', () => {
        render(<UserManagement />);
        expect(screen.getByText('alex.j@example.com')).toBeInTheDocument();
    });

    it('renders Active status badge', () => {
        render(<UserManagement />);
        const activeBadges = screen.getAllByText('Active');
        expect(activeBadges.length).toBeGreaterThan(0);
    });
});
