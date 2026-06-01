import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserDirectoryGrid from './UserDirectoryGrid';

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

    it('shows an empty state when there are no users', () => {
        render(<UserDirectoryGrid onOpenHistory={mockOpenHistory} />);
        expect(screen.getByText('No users yet')).toBeInTheDocument();
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
