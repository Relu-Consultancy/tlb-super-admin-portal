import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OverviewTab from './OverviewTab';

vi.mock('../../../shared/lib/api', () => ({
    getListingStats: vi.fn(),
    listListings: vi.fn(),
    listPartners: vi.fn(),
    listTransactions: vi.fn(),
    isPartnerOnboarding: (s: string) => !['under_review', 'activated_limited', 'approved', 'rejected'].includes(s),
    parseAmount: (v: any) => (v == null || v === '' ? null : Number(v)),
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { getListingStats, listListings, listPartners, listTransactions } from '../../../shared/lib/api';

const STATS = { draft: 1, pending: 2, published: 10, rejected: 1, archived: 0, total: 14 };
const LISTINGS = [
    { id: 'l1', is_paused: false },
    { id: 'l2', is_paused: true },
];
const PARTNERS = [
    { id: 'p1', is_active: true, status: 'approved', created_at: '2026-06-05T00:00:00Z' },
    { id: 'p2', is_active: false, status: 'under_review', created_at: '2020-01-01T00:00:00Z' },
];
const TX_PAGE = { count: 2, next: null, previous: null, results: [
    { transaction_id: 't1', amount: '100.00', customer_email: 'a@x.com' },
    { transaction_id: 't2', amount: '200.00', customer_email: 'b@x.com' },
] };

describe('OverviewTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getListingStats as any).mockResolvedValue(STATS);
        (listListings as any).mockResolvedValue(LISTINGS);
        (listPartners as any).mockResolvedValue(PARTNERS);
        (listTransactions as any).mockResolvedValue(TX_PAGE);
    });

    it('scopes every fetch to the given vertical and renders the health snapshot', async () => {
        render(<OverviewTab vertical="event" period="this_month" dateFrom="" dateTo="" />);
        expect(await screen.findByText('Health snapshot')).toBeInTheDocument();
        expect(getListingStats).toHaveBeenCalledWith('event');
        expect(listListings).toHaveBeenCalledWith(expect.objectContaining({ listing_type: 'event' }));
        expect(listPartners).toHaveBeenCalledWith(expect.objectContaining({ category: 'Events' }));
        expect(listTransactions).toHaveBeenCalledWith(expect.objectContaining({ booking_type: 'event' }));

        // Total Tickets Sold = 2 transactions, Total Revenue = 300.
        expect(screen.getByText('Total Tickets Sold').nextSibling?.textContent).toBe('2');
        expect(screen.getByText('Total Revenue').nextSibling?.textContent).toBe('₹300');
        expect(screen.getByText('Live').nextSibling?.textContent).toBe('10');
        expect(screen.getByText('Paused Listings').nextSibling?.textContent).toBe('1');
    });

    it('omits Dormant/Flagged/Payout tiles that have no backend source', async () => {
        render(<OverviewTab vertical="event" period="this_month" dateFrom="" dateTo="" />);
        await screen.findByText('Health snapshot');
        expect(screen.queryByText('Dormant')).not.toBeInTheDocument();
        expect(screen.queryByText('Flagged Partners')).not.toBeInTheDocument();
        expect(screen.queryByText('Payout Pending')).not.toBeInTheDocument();
    });
});
