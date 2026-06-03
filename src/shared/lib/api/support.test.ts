import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: {
        get: vi.fn(() => Promise.resolve([])),
        post: vi.fn(() => Promise.resolve({})),
        patch: vi.fn(() => Promise.resolve({})),
    },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
    listTickets,
    getTicketMessages,
    sendTicketMessage,
    updateTicketStatus,
    ticketStatusLabel,
    ticketStatusTone,
    ticketCategoryLabel,
} from './support';

describe('ticket display helpers', () => {
    it('ticketStatusLabel humanizes statuses', () => {
        expect(ticketStatusLabel('in_progress')).toBe('In Progress');
        expect(ticketStatusLabel('open')).toBe('Open');
    });
    it('ticketStatusTone maps statuses', () => {
        expect(ticketStatusTone('open')).toMatchObject({ color: expect.stringContaining('orange') });
        expect(ticketStatusTone('resolved')).toMatchObject({ color: expect.stringContaining('green') });
    });
    it('ticketCategoryLabel humanizes categories', () => {
        expect(ticketCategoryLabel('refund_status')).toBe('Refund Status');
    });
});

describe('support service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listTickets uses the help-admin prefix and passes filters', async () => {
        await listTickets({ status: 'open', category: 'refund_status' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/help/admin/tickets/', { params: { status: 'open', category: 'refund_status' } });
    });

    it('getTicketMessages passes a since cursor when provided', async () => {
        await getTicketMessages('t1', '2026-06-01T00:00:00Z');
        expect(api.get).toHaveBeenCalledWith('/api/v1/help/admin/tickets/t1/messages/', { params: { since: '2026-06-01T00:00:00Z' } });
        await getTicketMessages('t1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/help/admin/tickets/t1/messages/', { params: undefined });
    });

    it('sendTicketMessage posts the body', async () => {
        await sendTicketMessage('t1', 'hello');
        expect(api.post).toHaveBeenCalledWith('/api/v1/help/admin/tickets/t1/messages/send/', { body: 'hello' });
    });

    it('updateTicketStatus patches the status', async () => {
        await updateTicketStatus('t1', 'resolved');
        expect(api.patch).toHaveBeenCalledWith('/api/v1/help/admin/tickets/t1/update/', { status: 'resolved' });
    });
});
