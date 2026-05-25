import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventApproval from './EventApproval';

describe('EventApproval', () => {
    it('renders the Approve Event heading', () => {
        render(<EventApproval />);
        expect(screen.getByText('Approve Event')).toBeInTheDocument();
    });

    it('renders tab navigation', () => {
        render(<EventApproval />);
        expect(screen.getByText('Pending List')).toBeInTheDocument();
        expect(screen.getByText('Review Details')).toBeInTheDocument();
    });

    it('renders event cards from mock data', () => {
        render(<EventApproval />);
        // Events are rendered as cards; check at least one partner label is visible
        const partnerLabels = screen.getAllByText(/Partner:/i);
        expect(partnerLabels.length).toBeGreaterThan(0);
    });

    it('shows event detail view when an event card is clicked', async () => {
        render(<EventApproval />);
        // Click the first event card
        const cards = screen.getAllByText(/Partner:/i);
        fireEvent.click(cards[0].closest('.group')!);
        await waitFor(() => {
            expect(screen.getByText('Back to List')).toBeInTheDocument();
            expect(screen.getByText('Approve & Go Live')).toBeInTheDocument();
        });
    });

    it('returns to list view when Back to List is clicked', async () => {
        render(<EventApproval />);
        const cards = screen.getAllByText(/Partner:/i);
        fireEvent.click(cards[0].closest('.group')!);
        await waitFor(() => screen.getByText('Back to List'));
        fireEvent.click(screen.getByText('Back to List'));
        await waitFor(() => {
            expect(screen.getByText('Approve Event')).toBeInTheDocument();
        });
    });

    it('shows Quality Score in event detail view', async () => {
        render(<EventApproval />);
        const cards = screen.getAllByText(/Partner:/i);
        fireEvent.click(cards[0].closest('.group')!);
        await waitFor(() => {
            expect(screen.getByText(/Quality Score/i)).toBeInTheDocument();
        });
    });

    it('shows Reject with Feedback button in event detail', async () => {
        render(<EventApproval />);
        const cards = screen.getAllByText(/Partner:/i);
        fireEvent.click(cards[0].closest('.group')!);
        await waitFor(() => {
            expect(screen.getByText('Reject with Feedback')).toBeInTheDocument();
        });
    });
});
