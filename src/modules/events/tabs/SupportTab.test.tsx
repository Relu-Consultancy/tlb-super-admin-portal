import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SupportTab from './SupportTab';

vi.mock('../../../shared/lib/api', () => ({
    listPartners: vi.fn(),
    listTickets: vi.fn(),
    ticketStatusLabel: (s: string) => s,
    ticketStatusTone: () => ({ bg: 'bg-gray-100', color: 'text-gray-600' }),
    ticketCategoryLabel: (c: string) => c,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listPartners, listTickets } from '../../../shared/lib/api';

const PARTNERS = [{ id: 'p-1', business_name: 'Alpha Events' }];
const TICKETS = [
    { id: 't1', subject: 'Listing stuck in review', category: 'listing_issue', status: 'open', shared_with_partner_id: 'p-1', shared_with_partner_name: 'Alpha Events', created_at: '2026-06-01T00:00:00Z' },
    { id: 't2', subject: 'Unrelated partner ticket', category: 'other', status: 'open', shared_with_partner_id: 'p-999', shared_with_partner_name: 'Other Co', created_at: '2026-06-01T00:00:00Z' },
    { id: 't3', subject: 'Direct customer query', category: 'other', status: 'open', shared_with_partner_id: null, shared_with_partner_name: null, created_at: '2026-06-01T00:00:00Z' },
];

describe('SupportTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (listPartners as any).mockResolvedValue(PARTNERS);
        (listTickets as any).mockResolvedValue(TICKETS);
    });

    it('scopes tickets to partners in this vertical and excludes unrelated/unshared tickets', async () => {
        render(<SupportTab vertical="event" />);
        expect(await screen.findByText('Listing stuck in review')).toBeInTheDocument();
        expect(screen.queryByText('Unrelated partner ticket')).not.toBeInTheDocument();
        expect(screen.queryByText('Direct customer query')).not.toBeInTheDocument();
        expect(listPartners).toHaveBeenCalledWith(expect.objectContaining({ category: 'Events' }));
        // 2 tickets excluded — the note should mention it.
        expect(screen.getByText(/2 other tickets raised directly by customers/)).toBeInTheDocument();
    });
});
