import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FinancialsTab from './FinancialsTab';

vi.mock('../../../shared/lib/api', () => ({
    listTransactions: vi.fn(),
    parseAmount: (v: any) => (v == null || v === '' ? null : Number(v)),
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    bookingTypeLabel: (t: string) => t,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listTransactions } from '../../../shared/lib/api';

const TX_PAGE = { count: 1, next: null, previous: null, results: [
    { transaction_id: 't1', amount: '500.00', currency: 'INR', partner_name: 'Alpha', booking_reference: 'BK-1', booking_type: 'event', date: '2026-06-05T10:00:00Z' },
] };

describe('FinancialsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (listTransactions as any).mockResolvedValue(TX_PAGE);
    });

    it('renders revenue collected and a note that commission/fee/payout are unavailable', async () => {
        render(<FinancialsTab vertical="event" period="this_month" dateFrom="" dateTo="" />);
        expect(await screen.findByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Ticket revenue collected').nextSibling?.textContent).toBe('₹500');
        expect(screen.getByText(/Commission earned, TLB platform fee, and payout-pending breakdowns/)).toBeInTheDocument();
        expect(screen.queryByText('Commission Earned')).not.toBeInTheDocument();
        expect(screen.queryByText('Payout Pending')).not.toBeInTheDocument();
    });
});
