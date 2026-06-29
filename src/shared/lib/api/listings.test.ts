import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
    listListings,
    getListingStats,
    getListing,
    getListingHistory,
    approveListing,
    rejectListing,
    setListingVisibility,
    listingStatusLabel,
    listingStatusTone,
    listingTypeLabel,
    listingTypeTone,
    listingCategoryName,
    LISTING_TYPES,
    LISTING_STATUSES,
} from './listings';

describe('listings service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockResolvedValue([]);
        (api.post as any).mockResolvedValue({});
        (api.patch as any).mockResolvedValue({});
    });

    it('lists at the right path and forwards filters as params', async () => {
        await listListings({ status: 'pending', listing_type: 'venue', partner_id: 'p-1', search: 'art' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/', {
            params: { status: 'pending', listing_type: 'venue', partner_id: 'p-1', search: 'art', page_size: 100 },
        });
    });

    it('returns a bare array response unchanged', async () => {
        (api.get as any).mockResolvedValue([{ id: 'l-1' }]);
        await expect(listListings()).resolves.toEqual([{ id: 'l-1' }]);
        expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('follows pagination until every row is collected', async () => {
        (api.get as any)
            .mockResolvedValueOnce({ count: 3, results: [{ id: 'a' }, { id: 'b' }] })
            .mockResolvedValueOnce({ count: 3, results: [{ id: 'c' }] });
        const rows = await listListings();
        expect(rows.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
        expect((api.get as any).mock.calls[1][1].params.page).toBe(2);
    });

    it('scopes stats to a listing_type when given', async () => {
        (api.get as any).mockResolvedValue({ draft: 0, pending: 1, published: 2, rejected: 0, archived: 0, total: 3 });
        await getListingStats('event');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/stats/', { params: { listing_type: 'event' } });
    });

    it('requests unscoped stats with no params', async () => {
        (api.get as any).mockResolvedValue({ draft: 0, pending: 0, published: 0, rejected: 0, archived: 0, total: 0, by_type: {} });
        await getListingStats();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/stats/', { params: undefined });
    });

    it('normalizes media to an array and details to an object on detail', async () => {
        (api.get as any).mockResolvedValue({ id: 'l-1', title: 'X', media: 'str', details: { capacity: 10 } });
        const d = await getListing('l-1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/l-1/');
        expect(d.media).toEqual([]);
        expect(d.details).toEqual({ capacity: 10 });
    });

    it('nulls a non-object details block', async () => {
        (api.get as any).mockResolvedValue({ id: 'l-1', title: 'X', details: 'string-placeholder', media: [] });
        const d = await getListing('l-1');
        expect(d.details).toBeNull();
    });

    it('fetches review history as an array', async () => {
        (api.get as any).mockResolvedValue([{ id: 1, decision: 'published', comment: '', reviewed_by_email: 'a@b.c', created_at: 'x' }]);
        const logs = await getListingHistory('l-1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/l-1/history/');
        expect(logs).toHaveLength(1);
    });

    it('approves via POST with no body', async () => {
        await approveListing('l-1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/l-1/approve/');
    });

    it('rejects via POST with a comment body', async () => {
        await rejectListing('l-1', 'bad images');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/l-1/reject/', { comment: 'bad images' });
    });

    it('toggles visibility via PATCH', async () => {
        await setListingVisibility('l-1', true);
        expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/listings/l-1/visibility/', { is_paused: true });
    });

    it('labels/tones statuses and types, and resolves categories', () => {
        expect(listingStatusLabel('pending')).toBe('Pending');
        expect(listingStatusTone('published')).toContain('green');
        expect(listingTypeLabel('venue')).toBe('Venue');
        expect(listingTypeTone('event')).toContain('blue');
        expect(listingCategoryName({ id: 5, name: 'Music' })).toBe('Music');
        expect(listingCategoryName('Outdoor')).toBe('Outdoor');
        expect(listingCategoryName(null)).toBe('');
        expect(LISTING_TYPES).toContain('class');
        expect(LISTING_STATUSES).toContain('archived');
    });
});
