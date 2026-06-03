/**
 * Coupons & marketing service — `/marketing/coupons/`.
 *
 * NOTE: the backend marketing API is not live yet. These functions are written
 * against the expected `/api/v1/admin/marketing/coupons/` contract so the UI can
 * be wired in one line each once the endpoints ship. Until then, callers should
 * treat failures as "API not connected" (see CreateCoupon screen).
 */

import { api } from './client';
import { adminPath } from './config';
import type { Paginated } from './types';

export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponAppliesTo = 'all_events' | 'specific_partner' | 'category';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: CouponDiscountType;
  /** Percent (0–100) when type=percentage, or rupee amount when type=fixed. */
  discount_value: number;
  /** Optional cap on the rupee value of a percentage discount. */
  max_discount: number | null;
  /** Minimum order value required to apply the coupon. */
  min_order_value: number | null;
  usage_limit: number | null;
  used_count: number;
  applies_to: CouponAppliesTo;
  /** Set when applies_to=specific_partner / category. */
  target_id: string | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ListCouponsParams {
  search?: string;
  is_active?: boolean;
  /** e.g. `-created_at`, `code`. */
  ordering?: string;
  page?: number;
}

/** Payload for creating a coupon. */
export interface CreateCouponInput {
  code: string;
  description?: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount?: number | null;
  min_order_value?: number | null;
  usage_limit?: number | null;
  applies_to: CouponAppliesTo;
  target_id?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
}

/** GET /marketing/coupons/ — paginated list. */
export function listCoupons(params?: ListCouponsParams): Promise<Paginated<Coupon>> {
  return api.get<Paginated<Coupon>>(adminPath('marketing/coupons/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /marketing/coupons/{id}/ — single coupon detail. */
export function getCoupon(couponId: string): Promise<Coupon> {
  return api.get<Coupon>(adminPath(`marketing/coupons/${couponId}/`));
}

/** POST /marketing/coupons/ — create a coupon. */
export function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  return api.post<Coupon>(adminPath('marketing/coupons/'), input);
}

/** PATCH /marketing/coupons/{id}/ — partial update (e.g. toggle active). */
export function updateCoupon(couponId: string, input: Partial<CreateCouponInput> & { is_active?: boolean }): Promise<Coupon> {
  return api.patch<Coupon>(adminPath(`marketing/coupons/${couponId}/`), input);
}

/** DELETE /marketing/coupons/{id}/ — remove a coupon. */
export function deleteCoupon(couponId: string): Promise<{ detail: string }> {
  return api.delete<{ detail: string }>(adminPath(`marketing/coupons/${couponId}/`));
}
