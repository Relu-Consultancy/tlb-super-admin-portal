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
    listPartners,
    getPartnerMetrics,
    approvePartner,
    rejectPartner,
    requestPartnerChanges,
    verifyPartner,
    verifyPartnerBank,
    deactivatePartner,
    partnerStatusLabel,
    partnerStatusTone,
    isPartnerOnboarding,
} from './partners';

describe('partner display helpers', () => {
    it('partnerStatusLabel humanizes statuses', () => {
        expect(partnerStatusLabel('under_review')).toBe('Under Review');
        expect(partnerStatusLabel('approved')).toBe('Approved');
        expect(partnerStatusLabel('')).toBe('—');
    });

    it('partnerStatusTone maps statuses to colors', () => {
        expect(partnerStatusTone('approved')).toContain('green');
        expect(partnerStatusTone('rejected')).toContain('red');
        expect(partnerStatusTone('under_review')).toContain('blue');
    });

    it('isPartnerOnboarding is true only before the review pipeline', () => {
        expect(isPartnerOnboarding('category_selected')).toBe(true);
        expect(isPartnerOnboarding('initiated')).toBe(true);
        expect(isPartnerOnboarding('under_review')).toBe(false);
        expect(isPartnerOnboarding('approved')).toBe(false);
        expect(isPartnerOnboarding('rejected')).toBe(false);
    });
});

describe('partner service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listPartners normalizes a bare array response', async () => {
        (api.get as any).mockResolvedValue([{ id: 'p1' }]);
        await expect(listPartners({ status: 'approved' })).resolves.toEqual([{ id: 'p1' }]);
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/partners/', { params: { status: 'approved' } });
    });

    it('listPartners normalizes a paginated response', async () => {
        (api.get as any).mockResolvedValue({ results: [{ id: 'p2' }] });
        await expect(listPartners()).resolves.toEqual([{ id: 'p2' }]);
    });

    it('getPartnerMetrics hits the metrics endpoint', async () => {
        (api.get as any).mockResolvedValue({});
        await getPartnerMetrics();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/partners/metrics/', { params: undefined });
    });

    it('approve sends an (optional) comment', async () => {
        await approvePartner('p1', 'looks good');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/approve/', { comment: 'looks good' });
        await approvePartner('p1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/approve/', { comment: '' });
    });

    it('reject and request-changes send their required text', async () => {
        await rejectPartner('p1', 'bad docs');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/reject/', { reason: 'bad docs' });
        await requestPartnerChanges('p1', 'fix pan');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/request-changes/', { comment: 'fix pan' });
    });

    it('verify / verify-bank / deactivate hit their endpoints', async () => {
        await verifyPartner('p1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/verify/');
        await verifyPartnerBank('p1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/verify-bank/');
        await deactivatePartner('p1', 'spam');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/partners/p1/deactivate/', { reason: 'spam' });
    });
});
