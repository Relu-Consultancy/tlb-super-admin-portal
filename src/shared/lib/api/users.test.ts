import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: {
        get: vi.fn(() => Promise.resolve([])),
        post: vi.fn(() => Promise.resolve({})),
    },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
    listUsers,
    getUser,
    getUserMetrics,
    getUserBookings,
    getUserWishlist,
    disableUser,
    enableUser,
    forceLogoutUser,
    resetUserOtp,
    userDisplayName,
    formatMoney,
    humanizeKey,
    pickStat,
} from './users';

describe('user display helpers', () => {
    it('userDisplayName joins first/last and falls back to email', () => {
        expect(userDisplayName({ first_name: 'Ann', last_name: 'Lee', email: 'a@b.com' })).toBe('Ann Lee');
        expect(userDisplayName({ first_name: '', last_name: '', email: 'a@b.com' })).toBe('a@b.com');
    });

    it('formatMoney formats rupees and handles bad input', () => {
        expect(formatMoney('1500')).toBe('₹1,500.00');
        expect(formatMoney(null)).toBe('—');
        expect(formatMoney('')).toBe('—');
        expect(formatMoney('99', 'USD')).toBe('USD 99.00');
    });

    it('humanizeKey title-cases snake_case', () => {
        expect(humanizeKey('total_bookings')).toBe('Total Bookings');
    });

    it('pickStat returns the first present candidate', () => {
        expect(pickStat({ total_bookings: 3 }, 'bookings', 'total_bookings')).toBe(3);
        expect(pickStat({}, 'x')).toBeUndefined();
        expect(pickStat(null, 'x')).toBeUndefined();
    });
});

describe('user service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listUsers normalizes arrays and passes filters', async () => {
        (api.get as any).mockResolvedValue([{ id: 'u1' }]);
        await expect(listUsers({ search: 'ann', is_active: true })).resolves.toEqual([{ id: 'u1' }]);
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/users/', { params: { search: 'ann', is_active: true } });
    });

    it('getUser and getUserMetrics hit their endpoints', async () => {
        (api.get as any).mockResolvedValue({});
        await getUser('u1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/users/u1/');
        await getUserMetrics();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/users/metrics/', { params: undefined });
    });

    it('getUserBookings and wishlist pass their params', async () => {
        await getUserBookings('u1', { status: 'confirmed' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/users/u1/bookings/', { params: { status: 'confirmed' } });
        await getUserWishlist('u1', true);
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/users/u1/wishlist/', { params: { include_removed: 'true' } });
    });

    it('security actions hit the right endpoints', async () => {
        await disableUser('u1', 'spam');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/users/u1/disable/', { reason: 'spam' });
        await enableUser('u1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/users/u1/enable/');
        await forceLogoutUser('u1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/users/u1/force-logout/');
        await resetUserOtp('u1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/users/u1/reset-otp/');
    });
});
