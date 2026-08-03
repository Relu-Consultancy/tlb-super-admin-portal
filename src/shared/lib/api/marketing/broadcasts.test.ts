import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { get: vi.fn(), post: vi.fn() },
    ApiError: class ApiError extends Error {},
}));
import { api } from '../core/client';
import {
    listBroadcasts,
    createBroadcast,
    getBroadcast,
    cancelBroadcast,
    listDeliveries,
    sendBroadcastTest,
    estimateAudience,
    broadcastStatusLabel,
    broadcastStatusTone,
    deliveryStatusTone,
    isBroadcastCancellable,
    BROADCAST_AUDIENCES,
} from './broadcasts';

describe('broadcasts service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockResolvedValue([]);
        (api.post as any).mockResolvedValue({});
    });

    it('lists broadcasts at the right path with filters + page_size', async () => {
        await listBroadcasts({ status: 'SCHEDULED', date_from: '2026-06-01', date_to: '2026-06-30' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/broadcasts/', {
            params: { status: 'SCHEDULED', date_from: '2026-06-01', date_to: '2026-06-30', page_size: 100 },
        });
    });

    it('follows pagination for the list', async () => {
        (api.get as any)
            .mockResolvedValueOnce({ count: 2, results: [{ id: 'a' }] })
            .mockResolvedValueOnce({ count: 2, results: [{ id: 'b' }] });
        const rows = await listBroadcasts();
        expect(rows.map((r: any) => r.id)).toEqual(['a', 'b']);
        expect((api.get as any).mock.calls[1][1].params.page).toBe(2);
    });

    it('creates a broadcast via POST with the payload', async () => {
        const input = { title: 'T', subject: 'S', body: 'B', send_email: true, send_in_app: false, audience_filters: {}, scheduled_at: null };
        await createBroadcast(input);
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/broadcasts/', input);
    });

    it('gets detail, cancels, and sends a test at the right paths', async () => {
        await getBroadcast('b1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/broadcasts/b1/');
        await cancelBroadcast('b1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/broadcasts/b1/cancel/');
        await sendBroadcastTest('b1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/broadcasts/b1/send-test/');
    });

    it('lists deliveries with channel/status filters', async () => {
        await listDeliveries('b1', { channel: 'EMAIL', status: 'FAILED' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/broadcasts/b1/deliveries/', {
            params: { channel: 'EMAIL', status: 'FAILED', page_size: 100 },
        });
    });

    it('estimates audience via POST with audience_filters', async () => {
        (api.post as any).mockResolvedValue({ count: 1234 });
        const res = await estimateAudience({ roles: ['partner'] });
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/broadcasts/estimate/', { audience_filters: { roles: ['partner'] } });
        expect(res.count).toBe(1234);
    });

    it('exposes audience presets with the documented roles filter', () => {
        const values = BROADCAST_AUDIENCES.map((a) => a.value);
        expect(values).toEqual(['all', 'customers', 'partners']);
        expect(BROADCAST_AUDIENCES[0].filters).toEqual({});
        expect(BROADCAST_AUDIENCES[1].filters).toEqual({ roles: ['customer'] });
        expect(BROADCAST_AUDIENCES[2].filters).toEqual({ roles: ['partner'] });
    });

    it('labels/tones statuses and flags cancellable states', () => {
        expect(broadcastStatusLabel('SCHEDULED')).toBe('Scheduled');
        expect(broadcastStatusTone('SENT')).toContain('green');
        expect(deliveryStatusTone('BOUNCED')).toContain('orange');
        expect(isBroadcastCancellable('SCHEDULED')).toBe(true);
        expect(isBroadcastCancellable('SENDING')).toBe(true);
        expect(isBroadcastCancellable('SENT')).toBe(false);
    });
});
