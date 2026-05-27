import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    it('renders ticket list with user names', () => {
        render(<SupportSystem />);
        // Alex Thompson appears in list + chat header; Sarah only in list
        expect(screen.getAllByText('Alex Thompson').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    });

    it('renders the chat panel with first ticket selected', () => {
        render(<SupportSystem />);
        // Ticket ID appears in both chat header and details panel
        expect(screen.getAllByText('#TKT-4401').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the details sidebar', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Ticket Details')).toBeInTheDocument();
        expect(screen.getByText('Customer Info')).toBeInTheDocument();
    });

    it('renders the message input and send button', () => {
        render(<SupportSystem />);
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('can type and send a message', () => {
        render(<SupportSystem />);
        const input = screen.getByPlaceholderText('Type your message...');
        fireEvent.change(input, { target: { value: 'Test message' } });
        fireEvent.click(screen.getByText('Send'));
        expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('sends message on Enter key', () => {
        render(<SupportSystem />);
        const input = screen.getByPlaceholderText('Type your message...');
        fireEvent.change(input, { target: { value: 'Enter message' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(screen.getByText('Enter message')).toBeInTheDocument();
    });

    it('shows ticket status and priority badges', () => {
        render(<SupportSystem />);
        const highBadges = screen.getAllByText('High');
        expect(highBadges.length).toBeGreaterThan(0);
    });

    it('selects a different chat when clicked', () => {
        render(<SupportSystem />);
        fireEvent.click(screen.getByText('Michael Chen'));
        expect(screen.getAllByText('#TKT-4385').length).toBeGreaterThanOrEqual(1);
    });

    it('shows action buttons in details panel', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Escalate Ticket')).toBeInTheDocument();
        expect(screen.getByText('View User Profile')).toBeInTheDocument();
    });

    it('renders the Today separator', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Today')).toBeInTheDocument();
    });
});
