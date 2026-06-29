import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { get: vi.fn(() => Promise.resolve([])), post: vi.fn(() => Promise.resolve({})), patch: vi.fn(() => Promise.resolve({})) },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
    listCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    activateCoupon,
    deactivateCoupon,
    getCouponUsages,
    getPlatformCouponAnalytics,
    getTopCoupons,
    getRedemptionReport,
    couponDiscountLabel,
    couponTypeLabel,
    isCouponExpired,
} from './coupons';

describe('coupons service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockResolvedValue([]);
        (api.post as any).mockResolvedValue({});
        (api.patch as any).mockResolvedValue({});
    });

    it('lists coupons with filters + page_size', async () => {
        await listCoupons({ coupon_type: 'partner', discount_type: 'percent', is_active: true });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/coupons/', {
            params: { coupon_type: 'partner', discount_type: 'percent', is_active: true, page_size: 100 },
        });
    });

    it('hits the right paths for detail / create / update / activate / deactivate / usages', async () => {
        await getCoupon('c1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/coupons/c1/');

        await createCoupon({ code: 'X', discount_type: 'percent', discount_value: '20' });
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/coupons/create/', { code: 'X', discount_type: 'percent', discount_value: '20' });

        await updateCoupon('c1', { is_active: false });
        expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/coupons/c1/update/', { is_active: false });

        await activateCoupon('c1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/coupons/c1/activate/');
        await deactivateCoupon('c1');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/coupons/c1/deactivate/');

        await getCouponUsages('c1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/coupons/c1/usages/', { params: { page_size: 100 } });
    });

    it('hits analytics + redemption report paths', async () => {
        (api.get as any).mockResolvedValue({ total_coupons: 1 });
        await getPlatformCouponAnalytics();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/coupons/analytics/platform/');

        (api.get as any).mockResolvedValue([]);
        await getTopCoupons({ limit: 5, type: 'all' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/coupons/analytics/top/', { params: { limit: 5, type: 'all', page_size: 100 } });

        await getRedemptionReport({ coupon_type: 'platform' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/coupons/report/redemptions/', { params: { coupon_type: 'platform', page_size: 100 } });
    });

    it('formats discounts, labels types, and detects expiry', () => {
        expect(couponDiscountLabel('percent', '20')).toBe('20%');
        expect(couponDiscountLabel('fixed', '150')).toBe('₹150.00');
        expect(couponDiscountLabel('percent', '')).toBe('—');
        expect(couponTypeLabel('partner')).toBe('Partner');
        expect(isCouponExpired('2000-01-01')).toBe(true);
        expect(isCouponExpired('2099-01-01')).toBe(false);
        expect(isCouponExpired(null)).toBe(false);
    });
});
