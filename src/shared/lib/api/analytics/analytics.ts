/**
 * Admin Analytics service — `/api/v1/admin/analytics/`.
 *
 *   GET analytics/activity/summary/       — engagement (active/inactive) for
 *                                           customers & partners in a period,
 *                                           plus top event types. Reads LIVE
 *                                           events — no lag.
 *   GET analytics/listings/top-viewed/    — most-viewed listings in a period.
 *                                           Reads pre-aggregated daily rollups
 *                                           built by a 00:30 nightly job, so
 *                                           today's views won't appear until
 *                                           tomorrow — it can legitimately
 *                                           disagree with activity/summary/.
 *
 * Both require an admin JWT with `VIEW_ANALYTICS` (SUPER_ADMIN, ADMIN,
 * OPERATIONS_MANAGER by default). `period` accepts the same
 * today|yesterday|this_week|last_week|this_month|custom set as `stats.ts` —
 * an unknown value returns 400 `INVALID_PERIOD`. NOTE: `this_week`/`last_week`
 * are calendar weeks starting Monday, not rolling 7-day windows — don't label
 * a `this_week` tile "Last 7 Days" (use `resolvePeriodParams()` from
 * `shared/lib/period` to bridge the Terminology Guide's rolling windows).
 */

import { api } from '../core/client';
import { adminPath } from '../core/config';
import type { StatsPeriodInfo } from './stats';

export interface ActivityGroupStats {
  total: number;
  active: number;
  inactive: number;
  /** Percentage (1dp) of `total` that is `active` — already computed, don't recalculate. */
  active_rate: number;
}

export interface ActivityEventStat {
  /** Stable key, e.g. `view_listing`. */
  event_type: string;
  /** Display label, e.g. "View Listing". */
  label: string;
  count: number;
  unique_users: number;
}

export interface ActivitySummary {
  period: StatsPeriodInfo;
  customers: ActivityGroupStats;
  partners: ActivityGroupStats;
  /** Most frequent first. Empty when there's no activity in the period. */
  customer_events: ActivityEventStat[];
  /** Most frequent first. Empty when there's no activity in the period. */
  partner_events: ActivityEventStat[];
}

export interface TopViewedListing {
  listing_id: string;
  listing_name: string;
  /** Raw listing type — event | venue | class | program (lowercase). */
  vertical: string;
  views: number;
  enquiries: number;
  /** enquiries / views * 100; 0.0 when views is 0. */
  conversion_rate: number;
}

export interface TopViewedListingsResponse {
  period: StatsPeriodInfo;
  top_viewed_listings: TopViewedListing[];
}

export interface AnalyticsParams {
  period?: string;
  date_from?: string;
  date_to?: string;
}

function toParams(p?: AnalyticsParams): Record<string, string | undefined> | undefined {
  if (!p) return undefined;
  return { period: p.period, date_from: p.date_from, date_to: p.date_to };
}

/** GET analytics/activity/summary/ — customer/partner engagement + top event types for a period. */
export function getActivitySummary(params?: AnalyticsParams): Promise<ActivitySummary> {
  return api.get<ActivitySummary>(adminPath('analytics/activity/summary/'), { params: toParams(params) });
}

export interface TopViewedListingsParams extends AnalyticsParams {
  /** Defaults to 5, capped at 50 server-side. */
  limit?: number;
}

/** GET analytics/listings/top-viewed/ — most-viewed listings for a period (up to a day stale). */
export function getTopViewedListings(params?: TopViewedListingsParams): Promise<TopViewedListingsResponse> {
  return api.get<TopViewedListingsResponse>(adminPath('analytics/listings/top-viewed/'), {
    params: { ...toParams(params), limit: params?.limit },
  });
}

// --- Display helpers ---

const ANALYTICS_ERROR_LABELS: Record<string, string> = {
  INVALID_PERIOD: 'Unsupported period for analytics — pick one of the standard presets.',
};

/** Resolve a thrown ApiError code to a friendly message, with a fallback. */
export function analyticsErrorMessage(code: string | null | undefined, fallback: string): string {
  if (code && ANALYTICS_ERROR_LABELS[code]) return ANALYTICS_ERROR_LABELS[code];
  return fallback;
}
