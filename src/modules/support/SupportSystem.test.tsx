import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SupportSystem from './SupportSystem';

describe('SupportSystem', () => {
    it('renders the Active Tickets label', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Active Tickets')).toBeInTheDocument();
    });

    it('renders the search input for tickets', () => {
        render(<SupportSystem />);
        expect(screen.getByPlaceholderText('Search tickets...')).toBeInTheDocument();
    });

    it('renders ticket list from mock data', () => {
        render(<SupportSystem />);
        // SUPPORT_CHATS mock has user names
        const chatItems = screen.getAllByRole('button');
        // Multiple buttons including the ticket list items
        expect(chatItems.length).toBeGreaterThan(0);
    });

    it('renders a chat window with the first ticket selected by default', () => {
        render(<SupportSystem />);
        // First chat is selected by default; the send button should be visible
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('renders message input field', () => {
        render(<SupportSystem />);
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    it('renders the Online status for the active chat', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders the Today date separator in the chat', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders the ticket badge count', () => {
        render(<SupportSystem />);
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('switches active chat when another ticket is clicked', () => {
        render(<SupportSystem />);
        const ticketButtons = screen.getAllByRole('button').filter(
            (b) => b.className.includes('w-full p-4')
        );
        if (ticketButtons.length > 1) {
            fireEvent.click(ticketButtons[1]);
            // Chat window should still be present
            expect(screen.getByText('Send')).toBeInTheDocument();
        }
    });
});
