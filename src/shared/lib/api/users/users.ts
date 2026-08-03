/**
 * Admin User (customer) Management service — `/api/v1/admin/users/`.
 *
 * Covers: filterable list (with booking stats), full detail, registration
 * metrics, CSV export (queue → poll → download), per-user drill-downs
 * (activity / bookings / reviews / transactions / wishlist), and security
 * actions (disable / enable / force-logout / reset-otp / login-history /
 * security-log).
 */

import { api } from '../core/client';
import { adminPath, API_BASE_URL } from '../core/config';
import { getAccessToken } from '../core/token';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUserListItem {
  id: string;
  email: string;
  phone: string | null;
  auth_provider: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
  disabled_at: string | null;
  first_name: string;
  last_name: string;
  is_profile_complete: boolean;
  /** Free-form per-user booking stats (total bookings, spend, last booking…). */
  booking_stats: Record<string, unknown> | null;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  auth_provider: string;
  firebase_uid: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  forced_logout_at: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  deleted_at: string | null;
  customer_profile: Record<string, unknown> | null;
  booking_summary: Record<string, unknown> | null;
}

export interface UserMetrics {
  total_users: number;
  /** ⚠️ Now activity in the trailing 30 days (was the account-enabled flag) — label as "(30d)". */
  active_users: number;
  /** ⚠️ Now activity in the trailing 30 days (was the account-enabled flag) — label as "(30d)". */
  inactive_users: number;
  deleted_users: number;
  /** New — account status (the account-enabled flag `active_users` used to read). */
  enabled_users: number;
  /** New — account status (the account-disabled flag). */
  disabled_users: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  by_auth_provider: Record<string, number>;
  custom_range_count?: number;
}

export interface UserActivityItem {
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface ListingRef {
  id: string;
  title: string;
  listing_type: string;
}

export interface UserBooking {
  id: string;
  booking_reference: string;
  booking_type: string;
  status: string;
  payment_status: string;
  total_amount: string;
  platform_fee: string;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: string | null;
  created_at: string;
  listing: ListingRef | null;
  line_items: { item_type: string; quantity: number; unit_price: string; subtotal: string }[];
}

export interface UserReview {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  listing: ListingRef | null;
}

export interface UserTransaction {
  id: string;
  transaction_type: string;
  status: string;
  amount: string;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  failure_reason: string | null;
  failure_code: string | null;
  created_at: string;
  booking: Record<string, unknown> | null;
}

export interface UserWishlistItem {
  id: number;
  is_active: boolean;
  created_at: string;
  removed_at: string | null;
  listing: ListingRef | null;
}

export interface UserLoginEvent {
  id: number;
  ip_address: string;
  device_info: string;
  auth_provider: string;
  created_at: string;
}

export interface UserSecurityLogEntry {
  id: string;
  action: string;
  admin_email: string;
  ip_address: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ListUsersParams {
  search?: string;
  is_active?: boolean;
  auth_provider?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserExportJob {
  job_id: string;
  status: string;
  row_count?: number;
  created_at?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { results?: T[] }).results)) {
    return (res as { results: T[] }).results;
  }
  return [];
}

/** Best-effort display name from first/last name, falling back to email. */
export function userDisplayName(u: { first_name?: string; last_name?: string; email: string }): string {
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return name || u.email;
}

/** Read the first present value from a record across candidate keys. */
export function pickStat(stats: Record<string, unknown> | null | undefined, ...keys: string[]): unknown {
  if (!stats) return undefined;
  for (const k of keys) {
    if (stats[k] !== undefined && stats[k] !== null) return stats[k];
  }
  return undefined;
}

/** Format a money string/number as Indian Rupees. */
export function formatMoney(amount: string | number | null | undefined, currency = 'INR'): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(num)) return String(amount);
  const symbol = currency === 'INR' || !currency ? '₹' : `${currency} `;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Humanize a snake_case key, e.g. `total_bookings` -> "Total Bookings". */
export function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// List · detail · metrics
// ---------------------------------------------------------------------------

/** GET /users/ — filterable list of customer accounts (with booking stats). */
export async function listUsers(params?: ListUsersParams): Promise<AdminUserListItem[]> {
  const res = await api.get<unknown>(adminPath('users/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  return asArray<AdminUserListItem>(res);
}

/** GET /users/ — returns raw paginated response to support frontend pagination. */
export async function listUsersPaginated(params?: ListUsersParams): Promise<PaginatedResponse<AdminUserListItem>> {
  const res = await api.get<unknown>(adminPath('users/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  if (res && typeof res === 'object' && 'results' in res) {
    return res as PaginatedResponse<AdminUserListItem>;
  }
  const arr = asArray<AdminUserListItem>(res);
  return { count: arr.length, next: null, previous: null, results: arr };
}

/** GET /users/{id}/ — full customer detail. */
export function getUser(userId: string): Promise<AdminUserDetail> {
  return api.get<AdminUserDetail>(adminPath(`users/${userId}/`));
}

/** GET /users/metrics/ — registration metrics (today/week/month + splits). */
export function getUserMetrics(params?: { date_from?: string; date_to?: string }): Promise<UserMetrics> {
  return api.get<UserMetrics>(adminPath('users/metrics/'), {
    params: params as Record<string, string | undefined>,
  });
}

// ---------------------------------------------------------------------------
// Drill-downs
// ---------------------------------------------------------------------------

/** GET /users/{id}/activity/ — merged chronological feed (≤50 items). */
export async function getUserActivity(userId: string): Promise<UserActivityItem[]> {
  return asArray<UserActivityItem>(await api.get<unknown>(adminPath(`users/${userId}/activity/`)));
}

/** GET /users/{id}/bookings/ — booking history. */
export async function getUserBookings(
  userId: string,
  params?: { status?: string; ordering?: string },
): Promise<UserBooking[]> {
  return asArray<UserBooking>(
    await api.get<unknown>(adminPath(`users/${userId}/bookings/`), {
      params: params as Record<string, string | undefined>,
    }),
  );
}

/** GET /users/{id}/reviews/ — review history. */
export async function getUserReviews(userId: string, params?: { ordering?: string }): Promise<UserReview[]> {
  return asArray<UserReview>(
    await api.get<unknown>(adminPath(`users/${userId}/reviews/`), {
      params: params as Record<string, string | undefined>,
    }),
  );
}

/** GET /users/{id}/transactions/ — transaction history. */
export async function getUserTransactions(
  userId: string,
  params?: { status?: string; transaction_type?: string; ordering?: string },
): Promise<UserTransaction[]> {
  return asArray<UserTransaction>(
    await api.get<unknown>(adminPath(`users/${userId}/transactions/`), {
      params: params as Record<string, string | undefined>,
    }),
  );
}

/** GET /users/{id}/wishlist/ — wishlist items. */
export async function getUserWishlist(userId: string, includeRemoved = false): Promise<UserWishlistItem[]> {
  return asArray<UserWishlistItem>(
    await api.get<unknown>(adminPath(`users/${userId}/wishlist/`), {
      params: includeRemoved ? { include_removed: 'true' } : undefined,
    }),
  );
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

/** POST /users/{id}/disable/ — disable a customer account. Reason required. */
export function disableUser(userId: string, reason: string): Promise<{ detail?: string }> {
  return api.post<{ detail?: string }>(adminPath(`users/${userId}/disable/`), { reason });
}

/** POST /users/{id}/enable/ — re-enable a customer account. */
export function enableUser(userId: string): Promise<{ detail?: string }> {
  return api.post<{ detail?: string }>(adminPath(`users/${userId}/enable/`));
}

/** POST /users/{id}/force-logout/ — invalidate all of the user's JWTs. */
export function forceLogoutUser(userId: string): Promise<{ detail?: string }> {
  return api.post<{ detail?: string }>(adminPath(`users/${userId}/force-logout/`));
}

/** POST /users/{id}/reset-otp/ — admin-initiated OTP send to the user. */
export function resetUserOtp(userId: string): Promise<{ detail?: string }> {
  return api.post<{ detail?: string }>(adminPath(`users/${userId}/reset-otp/`));
}

/** GET /users/{id}/login-history/ — last 20 login events. */
export async function getUserLoginHistory(userId: string): Promise<UserLoginEvent[]> {
  return asArray<UserLoginEvent>(await api.get<unknown>(adminPath(`users/${userId}/login-history/`)));
}

/** GET /users/{id}/security-log/ — admin actions taken against this user. */
export async function getUserSecurityLog(userId: string): Promise<UserSecurityLogEntry[]> {
  return asArray<UserSecurityLogEntry>(await api.get<unknown>(adminPath(`users/${userId}/security-log/`)));
}

// ---------------------------------------------------------------------------
// CSV export (queue → poll → download)
// ---------------------------------------------------------------------------

/** POST /users/export/ — queue a CSV export job (filters in the body). */
export function queueUserExport(filters?: ListUsersParams): Promise<UserExportJob> {
  return api.post<UserExportJob>(adminPath('users/export/'), filters ?? {});
}

/** GET /users/export/{job_id}/ — poll an export job's status. */
export function getUserExportJob(jobId: string): Promise<UserExportJob> {
  return api.get<UserExportJob>(adminPath(`users/export/${jobId}/`));
}

/** GET /users/export/{job_id}/download/ — fetch the finished CSV as a Blob. */
export async function downloadUserExport(jobId: string): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${adminPath(`users/export/${jobId}/download/`)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}
