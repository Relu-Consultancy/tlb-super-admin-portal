/**
 * Admin Statistics service — `/api/v1/admin/stats/`.
 *
 *   GET stats/overview/   — platform-wide dashboard (users, listings, bookings,
 *                           revenue, support, trend, recent activity)
 *   GET stats/customers/  — customer analytics (acquisition, engagement, spend)
 *   GET stats/partners/   — partner analytics (onboarding funnel, performance)
 *
 * All accept a `period` (today | yesterday | this_week | last_week | this_month
 * | custom) and, for `custom`, `date_from` / `date_to` (YYYY-MM-DD).
 *
 * NOTE: money fields come back as STRINGS (e.g. "-9.21", "57584.") — parse with
 * `parseAmount()` / format with `formatMoney()`; never do math on them raw.
 *
 * ⚠️ `summary.active` / `summary.inactive` on `stats/customers/` and
 * `stats/partners/` changed meaning: they used to read the account-enabled
 * flag, now they mean "performed at least one meaningful activity during the
 * selected period" (TLB Terminology Guide). The number is period-dependent
 * and will read near-zero until activity tracking accumulates data — that's
 * expected, not a bug. Label these tiles with their window, e.g.
 * "Active (this month)". For account status (enabled/disabled), use the new
 * `summary.enabled` / `summary.disabled` fields instead.
 */

import { api } from '../core/client';
import { adminPath } from '../core/config';

export const STATS_PERIODS = ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'custom'] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];

/** Human labels for the period presets (custom is handled with date pickers). */
export const STATS_PERIOD_LABELS: Record<StatsPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  custom: 'Custom Range',
};

export interface StatsParams {
  period?: string;
  date_from?: string;
  date_to?: string;
}

export interface StatsPeriodInfo {
  type: string;
  date_from: string;
  date_to: string;
  label: string;
}

// --- Overview ---

export interface OverviewRevenue {
  gross: string;
  refunds: string;
  net: string;
  platform_fees: string;
  avg_order_value: string;
  currency: string;
}

export interface OverviewTrendPoint {
  date: string;
  bookings: number;
  revenue: string;
  signups: number;
}

export interface RecentBooking {
  id: string;
  booking_reference: string;
  status: string;
  amount: string;
  customer_email: string;
  created_at: string;
}
export interface RecentSignup {
  id: string;
  email: string;
  role: string;
  auth_provider: string;
  created_at: string;
}
export interface RecentTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  raised_by_role: string;
  created_at: string;
}

export interface OverviewStats {
  period: StatsPeriodInfo;
  users: { total_customers: number; total_partners: number; new_customers: number; new_partners: number };
  listings: { total: number; published: number; pending_moderation: number; rejected: number; draft: number; by_type: Record<string, number> };
  bookings: { total: number; confirmed: number; cancelled: number; refunded: number; pending: number; attended: number };
  revenue: OverviewRevenue;
  support: { open: number; in_progress: number; resolved_in_period: number; total_open: number };
  trend: OverviewTrendPoint[];
  recent_activity: { bookings: RecentBooking[]; signups: RecentSignup[]; tickets: RecentTicket[] };
}

// --- Customers ---

export interface TopCustomer { customer_id: number; email: string; total_spend: string; bookings: number }
export interface CustomerStats {
  period: StatsPeriodInfo;
  /**
   * `active`/`inactive` = engagement during `period` (not account status).
   * `enabled`/`disabled` = account status (new — use these for an "enabled
   * accounts" tile or a disabled-user badge).
   */
  summary: { total: number; new_in_period: number; active: number; inactive: number; enabled: number; disabled: number };
  acquisition: { today: number; yesterday: number; this_week: number; last_week: number; this_month: number; by_auth_provider: Record<string, number> };
  engagement: { with_bookings: number; without_bookings: number; repeat_customers: number; conversion_rate: number };
  spend: { total_spend_net: string; avg_order_value: string; top_customers: TopCustomer[] };
  trend: { date: string; signups: number }[];
  recent_signups: RecentSignup[];
}

// --- Partners ---

export interface TopPartner { partner_id: string; business_name: string; revenue: string; bookings: number; listings: number }
export interface PartnerStats {
  period: StatsPeriodInfo;
  /** `active`/`inactive` = engagement during `period`; `enabled`/`disabled` = account status (new). */
  summary: { total: number; new_in_period: number; active: number; inactive: number; enabled: number; disabled: number };
  onboarding_funnel: Record<string, number>;
  pending_actions: { awaiting_approval: number; awaiting_verification: number };
  listings: { total: number; published: number; pending_moderation: number; rejected: number; draft: number; by_type: Record<string, number> };
  performance: { gross_merchandise_value: string; top_partners: TopPartner[] };
  by_category: { category: string; partner_count: number }[];
  trend: { date: string; signups: number }[];
  recent_partners: { id: string; business_name: string; email: string; status: string; is_verified: boolean; created_at: string }[];
}

function toParams(p?: StatsParams): Record<string, string | undefined> | undefined {
  if (!p) return undefined;
  return { period: p.period, date_from: p.date_from, date_to: p.date_to };
}

/** GET stats/overview/ — platform-wide dashboard overview. */
export function getOverviewStats(params?: StatsParams): Promise<OverviewStats> {
  return api.get<OverviewStats>(adminPath('stats/overview/'), { params: toParams(params) });
}

/** GET stats/customers/ — customer acquisition / engagement / spend analytics. */
export function getCustomerStats(params?: StatsParams): Promise<CustomerStats> {
  return api.get<CustomerStats>(adminPath('stats/customers/'), { params: toParams(params) });
}

/** GET stats/partners/ — partner onboarding funnel + performance analytics. */
export function getPartnerStats(params?: StatsParams): Promise<PartnerStats> {
  return api.get<PartnerStats>(adminPath('stats/partners/'), { params: toParams(params) });
}

// --- Helpers ---

/** Parse a string money/number field into a number, or null if not parseable. */
export function parseAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '' || value === '-') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(n) ? null : n;
}

/** A currency code is only usable if it's a real 3-letter code; else default INR. */
export function safeCurrency(code: string | null | undefined): string {
  return code && /^[A-Za-z]{3}$/.test(code) ? code.toUpperCase() : 'INR';
}
