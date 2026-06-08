/**
 * Admin Coupons service — `/api/v1/admin/coupons/`.
 *
 * Platform- and partner-scoped coupons: list / detail / create / update /
 * activate / deactivate / usage history, plus analytics (platform & partner
 * summaries, top coupons, usage-over-time) and a redemption report.
 *
 * NOTE: money fields (discount_value, max_discount, min_order_value,
 * discount_applied, total_discount_saved …) come back as STRINGS — parse with
 * `parseAmount()` / format with `formatMoney()`; never do math on them raw.
 */

import { api } from './client';
import { adminPath } from './config';

export const COUPON_TYPES = ['platform', 'partner'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const DISCOUNT_TYPES = ['percent', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface CouponListItem {
  id: string;
  code: string;
  coupon_type: string;
  partner_email: string | null;
  created_by_admin_email: string | null;
  discount_type: string;
  discount_value: string;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
  expires_at: string | null;
  created_at: string;
}

export interface TargetListing { id: string; title: string; listing_type: string }
export interface TargetCategory { id: number; name: string }

export interface CouponDetail {
  id: string;
  code: string;
  coupon_type: string;
  partner_email: string | null;
  created_by_admin_email: string | null;
  description: string;
  is_active: boolean;
  discount_type: string;
  discount_value: string;
  max_discount: string | null;
  min_order_value: string | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  target_listings: TargetListing[];
  target_event_categories: TargetCategory[];
  target_listing_types: string[] | string | null;
  target_genders: string[] | string | null;
  target_min_age: number | null;
  target_max_age: number | null;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: number;
  customer_email: string;
  booking_reference: string;
  discount_applied: string;
  used_at: string;
}

/** Create/update payload (update accepts the same fields, all optional). */
export interface CouponInput {
  code: string;
  /** Required for a partner coupon; omit for a platform coupon. */
  partner_id?: string;
  description?: string;
  is_active?: boolean;
  discount_type: string;
  discount_value: string;
  max_discount?: string | null;
  min_order_value?: string | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  target_listing_ids?: string[];
  target_event_category_ids?: number[];
  target_listing_types?: string[];
  target_genders?: string[];
  target_min_age?: number | null;
  target_max_age?: number | null;
}

export interface ListCouponsParams {
  coupon_type?: string;
  discount_type?: string;
  is_active?: boolean;
  partner_id?: string;
}

export interface CouponAnalytics {
  total_coupons: number;
  active_coupons: number;
  inactive_coupons: number;
  expired_coupons: number;
  total_redemptions: number;
  redemptions_this_month: number;
  total_discount_saved: string;
  avg_redemption_rate: number;
}

export interface TopCoupon {
  id: string;
  code: string;
  coupon_type: string;
  partner_email: string | null;
  discount_type: string;
  discount_value: string;
  usage_count: number;
  usage_limit: number | null;
  redemption_rate: string;
}

export interface UsageOverTimePoint {
  period: string;
  redemptions: number;
  total_discount: string;
}

export interface RedemptionRow {
  id: number;
  coupon_code: string;
  coupon_type: string;
  discount_type: string;
  partner_email: string | null;
  customer_email: string;
  booking_reference: string;
  discount_applied: string;
  used_at: string;
}

export interface RedemptionParams {
  coupon_code?: string;
  coupon_type?: string;
  discount_type?: string;
  partner_id?: string;
  used_at_from?: string;
  used_at_to?: string;
}

/** Normalize an array-or-paginated response into a plain array. */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { results?: T[] }).results)) {
    return (res as { results: T[] }).results;
  }
  return [];
}

/** Paginated fetch that follows every page (docs may show a bare array). */
async function fetchAllPages<T>(path: string, base: Record<string, string | number | boolean | undefined>): Promise<T[]> {
  const first = await api.get<unknown>(path, { params: { ...base, page_size: 100 } });
  if (Array.isArray(first)) return first as T[];
  const all = asArray<T>(first);
  const count = (first as { count?: unknown })?.count;
  if (typeof count !== 'number') return all;
  for (let page = 2; all.length < count && page < 100; page++) {
    const res = await api.get<unknown>(path, { params: { ...base, page_size: 100, page } });
    const rows = asArray<T>(res);
    if (rows.length === 0) break;
    all.push(...rows);
  }
  return all;
}

// --- CRUD ---

/** GET /coupons/ — list (filter by type / discount / active / partner). */
export function listCoupons(params?: ListCouponsParams): Promise<CouponListItem[]> {
  return fetchAllPages<CouponListItem>(adminPath('coupons/'), (params ?? {}) as Record<string, string | boolean | undefined>);
}

/** GET /coupons/{id}/ — full coupon detail. */
export function getCoupon(couponId: string): Promise<CouponDetail> {
  return api.get<CouponDetail>(adminPath(`coupons/${couponId}/`));
}

/** POST /coupons/create/ — create a platform (no partner_id) or partner coupon. */
export function createCoupon(input: CouponInput): Promise<CouponDetail> {
  return api.post<CouponDetail>(adminPath('coupons/create/'), input);
}

/** PATCH /coupons/{id}/update/ — update any coupon. */
export function updateCoupon(couponId: string, input: Partial<CouponInput>): Promise<CouponDetail> {
  return api.patch<CouponDetail>(adminPath(`coupons/${couponId}/update/`), input);
}

/** POST /coupons/{id}/activate/ — activate a coupon. */
export function activateCoupon(couponId: string): Promise<unknown> {
  return api.post(adminPath(`coupons/${couponId}/activate/`));
}

/** POST /coupons/{id}/deactivate/ — deactivate a coupon. */
export function deactivateCoupon(couponId: string): Promise<unknown> {
  return api.post(adminPath(`coupons/${couponId}/deactivate/`));
}

/** GET /coupons/{id}/usages/ — per-redemption usage history for a coupon. */
export function getCouponUsages(couponId: string): Promise<CouponUsage[]> {
  return fetchAllPages<CouponUsage>(adminPath(`coupons/${couponId}/usages/`), {});
}

// --- Analytics ---

/** GET /coupons/analytics/platform/ — platform coupon summary. */
export function getPlatformCouponAnalytics(): Promise<CouponAnalytics> {
  return api.get<CouponAnalytics>(adminPath('coupons/analytics/platform/'));
}

/** GET /coupons/analytics/partners/ — partner coupon summary. */
export function getPartnerCouponAnalytics(): Promise<CouponAnalytics> {
  return api.get<CouponAnalytics>(adminPath('coupons/analytics/partners/'));
}

/** GET /coupons/analytics/top/ — top coupons by usage. */
export function getTopCoupons(params?: { limit?: number; type?: string }): Promise<TopCoupon[]> {
  return fetchAllPages<TopCoupon>(adminPath('coupons/analytics/top/'), (params ?? {}) as Record<string, string | number | undefined>);
}

/** GET /coupons/analytics/usage-over-time/ — redemption trend. */
export function getCouponUsageOverTime(params?: { days?: number; period?: string; type?: string }): Promise<UsageOverTimePoint[]> {
  return fetchAllPages<UsageOverTimePoint>(adminPath('coupons/analytics/usage-over-time/'), (params ?? {}) as Record<string, string | number | undefined>);
}

// --- Redemption report ---

/** GET /coupons/report/redemptions/ — filterable redemption report. */
export function getRedemptionReport(params?: RedemptionParams): Promise<RedemptionRow[]> {
  return fetchAllPages<RedemptionRow>(adminPath('coupons/report/redemptions/'), (params ?? {}) as Record<string, string | undefined>);
}

// --- Display helpers ---

/** Format a coupon's discount, e.g. "20%" or "₹150.00". */
export function couponDiscountLabel(discountType: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  if (discountType === 'percent') return `${n}%`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Humanize a coupon type, e.g. `platform` -> "Platform". */
export function couponTypeLabel(type: string): string {
  if (!type) return '—';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Tailwind badge classes for a coupon type. */
export function couponTypeTone(type: string): string {
  return type === 'partner' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600';
}

/** True when the coupon's expiry date is in the past. */
export function isCouponExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return !Number.isNaN(t) && t < Date.now();
}
