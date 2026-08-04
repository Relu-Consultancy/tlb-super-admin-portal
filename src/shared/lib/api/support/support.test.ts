import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/client', () => ({
    api: {
        get: vi.fn(() => Promise.resolve([])),
        post: vi.fn(() => Promise.resolve({})),
        patch: vi.fn(() => Promise.resolve({})),
    },
    ApiError: class ApiError extends Error {},
}));
import { api } from '../core/client';
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
        expect(api.get).toHaveBeenCalledWith('/api/v1/help/admin/tickets/', { params: { status: 'open', category: 'refund_status', page_size: 100 } });
    });

    it('listTickets returns a bare array response unchanged', async () => {
        (api.get as any).mockResolvedValue([{ id: 't1' }]);
        await expect(listTickets()).resolves.toEqual([{ id: 't1' }]);
        expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('listTickets normalizes and follows a paginated response', async () => {
        (api.get as any)
            .mockResolvedValueOnce({ count: 2, results: [{ id: 't1' }] })
            .mockResolvedValueOnce({ count: 2, results: [{ id: 't2' }] });
        const rows = await listTickets();
        expect(rows.map((r: any) => r.id)).toEqual(['t1', 't2']);
        expect((api.get as any).mock.calls[1][1].params.page).toBe(2);
    });

    it('getTicketMessages unwraps the { ticket_status, messages } payload', async () => {
        (api.get as any).mockResolvedValue({ ticket_status: 'in_progress', messages: [{ id: 'm1' }, { id: 'm2' }] });
        const thread = await getTicketMessages('t1');
        expect(thread.ticket_status).toBe('in_progress');
        expect(thread.messages.map((m: any) => m.id)).toEqual(['m1', 'm2']);
    });

    it('getTicketMessages tolerates a legacy bare-array response', async () => {
        (api.get as any).mockResolvedValue([{ id: 'm1' }]);
        const thread = await getTicketMessages('t1');
        expect(thread.ticket_status).toBe('');
        expect(thread.messages).toEqual([{ id: 'm1' }]);
    });

    it('getTicketMessages passes a since cursor when provided', async () => {
        (api.get as any).mockResolvedValue({ ticket_status: 'open', messages: [] });
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

describe('ticketPollInterval', () => {
    it('maps each status to its recommended cadence (closed → stop)', async () => {
        const { ticketPollInterval } = await import('./support');
        expect(ticketPollInterval('in_progress')).toBe(5_000);
        expect(ticketPollInterval('open')).toBe(30_000);
        expect(ticketPollInterval('resolved')).toBe(60_000);
        expect(ticketPollInterval('closed')).toBeNull();
        expect(ticketPollInterval('whatever')).toBe(15_000);
    });
});
