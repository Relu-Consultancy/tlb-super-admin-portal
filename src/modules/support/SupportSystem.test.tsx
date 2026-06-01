import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import SupportSystem from './SupportSystem';

beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

describe('SupportSystem', () => {
    it('renders stat cards', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Total Tickets')).toBeInTheDocument();
    });

    it('renders the search input', () => {
        render(<SupportSystem />);
        expect(screen.getByPlaceholderText('Search by name or ticket ID...')).toBeInTheDocument();
    });

    it('renders filter tabs with counts', () => {
        render(<SupportSystem />);
        expect(screen.getByText(/All \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText(/Active \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText(/Pending \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText(/Resolved \(\d+\)/)).toBeInTheDocument();
    });

    it('shows an empty ticket list when there are no tickets', () => {
        render(<SupportSystem />);
        expect(screen.getByText('No tickets found')).toBeInTheDocument();
    });

    it('shows a placeholder in the chat panel when no ticket is selected', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Select a ticket to start')).toBeInTheDocument();
    });
});
