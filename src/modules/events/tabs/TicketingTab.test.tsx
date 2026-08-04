import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TicketingTab from './TicketingTab';

vi.mock('../../../shared/lib/api', () => ({
    listTransactions: vi.fn(),
    parseAmount: (v: any) => (v == null || v === '' ? null : Number(v)),
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    bookingTypeLabel: (t: string) => t,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listTransactions } from '../../../shared/lib/api';

const TX_PAGE = { count: 1, next: null, previous: null, results: [
    { transaction_id: 't1', amount: '150.00', currency: 'INR', customer_email: 'a@x.com', booking_reference: 'BK-1', booking_type: 'event', date: '2026-06-05T10:00:00Z' },
] };

describe('TicketingTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (listTransactions as any).mockResolvedValue(TX_PAGE);
    });

    it('scopes the query to the vertical and renders tiles + rows', async () => {
        render(<TicketingTab vertical="venue" period="this_month" dateFrom="" dateTo="" />);
        expect(await screen.findByText('a@x.com')).toBeInTheDocument();
        expect(listTransactions).toHaveBeenCalledWith(expect.objectContaining({ booking_type: 'venue', page: 1 }));
        expect(screen.getByText('Tickets sold (period)').nextSibling?.textContent).toBe('1');
        expect(screen.getByText('Unique buyers').nextSibling?.textContent).toBe('1');
        expect(screen.getByText('Ticket revenue').nextSibling?.textContent).toBe('₹150');
    });

    it('shows an empty state when there are no transactions', async () => {
        (listTransactions as any).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
        render(<TicketingTab vertical="class" period="this_month" dateFrom="" dateTo="" />);
        expect(await screen.findByText('No ticket transactions')).toBeInTheDocument();
    });

    it('shows an error state when the fetch fails', async () => {
        (listTransactions as any).mockRejectedValue(new Error('boom'));
        render(<TicketingTab vertical="program" period="this_month" dateFrom="" dateTo="" />);
        expect(await screen.findByText('Failed to load ticketing data.')).toBeInTheDocument();
    });
});
