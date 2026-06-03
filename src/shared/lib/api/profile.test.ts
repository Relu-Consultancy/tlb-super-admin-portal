import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { get: vi.fn(() => Promise.resolve({})) },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import { getProfile, getSessions } from './profile';

describe('profile service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getProfile hits the profile endpoint', async () => {
        await getProfile();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/profile/');
    });

    it('getSessions hits the sessions endpoint', async () => {
        await getSessions();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/sessions/');
    });
});
