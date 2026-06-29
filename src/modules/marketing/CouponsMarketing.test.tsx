import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CouponsMarketing from './CouponsMarketing';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, { get(_: any, tag: string) {
            if (!cache[tag]) cache[tag] = ({ children, ...p }: any) => { const { initial, animate, exit, transition, layoutId, ...rest } = p; return React.createElement(tag as any, rest, children); };
            return cache[tag];
        } }),
        AnimatePresence: ({ children }: any) => children,
    };
});

const { authState } = vi.hoisted(() => ({ authState: { manage: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: (p: string) => (p === 'MANAGE_LISTINGS' ? authState.manage : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
    listCoupons: vi.fn(),
    getCoupon: vi.fn(),
    getCouponUsages: vi.fn(() => Promise.resolve([])),
    activateCoupon: vi.fn(() => Promise.resolve(null)),
    deactivateCoupon: vi.fn(() => Promise.resolve(null)),
    getPlatformCouponAnalytics: vi.fn(),
    getPartnerCouponAnalytics: vi.fn(),
    getRedemptionReport: vi.fn(() => Promise.resolve([])),
    couponDiscountLabel: (t: string, v: any) => (t === 'percent' ? `${v}%` : `₹${v}`),
    couponTypeLabel: (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'),
    couponTypeTone: () => 'bg-blue-50 text-blue-600',
    isCouponExpired: (e: any) => (e ? new Date(e).getTime() < Date.now() : false),
    parseAmount: (v: any) => (v == null || v === '' ? null : Number(v)),
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    COUPON_TYPES: ['platform', 'partner'],
    DISCOUNT_TYPES: ['percent', 'fixed'],
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listCoupons, getCoupon, deactivateCoupon, getPlatformCouponAnalytics, getPartnerCouponAnalytics } from '../../shared/lib/api';

const COUPONS = [
    { id: 'c1', code: 'SAVE20', coupon_type: 'platform', partner_email: null, created_by_admin_email: 'admin@x.com', discount_type: 'percent', discount_value: '20', is_active: true, usage_count: 5, usage_limit: 100, expires_at: '2099-12-31', created_at: '2026-06-01' },
    { id: 'c2', code: 'PARTNER50', coupon_type: 'partner', partner_email: 'p@x.com', created_by_admin_email: 'admin@x.com', discount_type: 'fixed', discount_value: '50', is_active: false, usage_count: 0, usage_limit: null, expires_at: '2099-12-31', created_at: '2026-05-01' },
];
const ANALYTICS = { total_coupons: 10, active_coupons: 6, inactive_coupons: 4, expired_coupons: 1, total_redemptions: 120, redemptions_this_month: 12, total_discount_saved: '5000', avg_redemption_rate: 0.4 };
const DETAIL = { ...COUPONS[0], description: 'Save 20%', max_discount: '200', min_order_value: '500', per_user_limit: 1, starts_at: '2026-06-01', target_listings: [], target_event_categories: [], target_listing_types: ['event'], target_genders: [], target_min_age: null, target_max_age: null, updated_at: '2026-06-02' };

describe('CouponsMarketing', () => {
    const onCreate = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        authState.manage = true;
        (listCoupons as any).mockResolvedValue(COUPONS);
        (getPlatformCouponAnalytics as any).mockResolvedValue(ANALYTICS);
        (getPartnerCouponAnalytics as any).mockResolvedValue(ANALYTICS);
        (getCoupon as any).mockResolvedValue(DETAIL);
    });

    it('renders the heading and analytics tiles', async () => {
        render(<CouponsMarketing onCreateCoupon={onCreate} />);
        expect(screen.getByText('Coupons & Marketing')).toBeInTheDocument();
        expect(await screen.findByText('Total Coupons')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument(); // combined total_coupons (10+10)
    });

    it('lists coupons from the API', async () => {
        render(<CouponsMarketing onCreateCoupon={onCreate} />);
        expect(await screen.findByText('SAVE20')).toBeInTheDocument();
        expect(screen.getByText('PARTNER50')).toBeInTheDocument();
    });

    it('navigates to Create Coupon', async () => {
        render(<CouponsMarketing onCreateCoupon={onCreate} />);
        await userEvent.click(await screen.findByRole('button', { name: /Create Coupon/i }));
        expect(onCreate).toHaveBeenCalled();
    });

    it('deactivates an active coupon from the row action', async () => {
        render(<CouponsMarketing onCreateCoupon={onCreate} />);
        await screen.findByText('SAVE20');
        await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
        await waitFor(() => expect(deactivateCoupon).toHaveBeenCalledWith('c1'));
    });

    it('opens the detail slide-over', async () => {
        render(<CouponsMarketing onCreateCoupon={onCreate} />);
        await userEvent.click(await screen.findByText('SAVE20'));
        await waitFor(() => expect(getCoupon).toHaveBeenCalledWith('c1'));
        expect(await screen.findByText('Coupon Detail')).toBeInTheDocument();
        expect(screen.getByText('Save 20%')).toBeInTheDocument();
    });

    it('hides write actions without permission', async () => {
        authState.manage = false;
        render(<CouponsMarketing onCreateCoupon={onCreate} />);
        await screen.findByText('SAVE20');
        expect(screen.queryByRole('button', { name: /Create Coupon/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    });
});
