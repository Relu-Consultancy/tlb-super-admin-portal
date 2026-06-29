/**
 * Admin Broadcasts service — `/api/v1/admin/broadcasts/`.
 *
 * Mass notification engine: compose a message, target an audience, and send it
 * (immediately or scheduled) over email and/or in-app channels to the user app
 * and partner portal. Endpoints:
 *   GET    broadcasts/                      — list (filter date_from/date_to/status)
 *   POST   broadcasts/                      — create + trigger/schedule
 *   GET    broadcasts/{id}/                 — detail with delivery stats
 *   POST   broadcasts/{id}/cancel/          — cancel a scheduled / in-progress send
 *   GET    broadcasts/{id}/deliveries/      — per-recipient delivery list (paginated)
 *   POST   broadcasts/{id}/send-test/       — test delivery to the requesting admin only
 *   POST   broadcasts/estimate/             — estimate audience count for filters
 *
 * NOTE: creating without `scheduled_at` sends IMMEDIATELY — this is outward-facing
 * and irreversible. The UI confirms before an immediate send and offers send-test.
 */

import { api } from './client';
import { adminPath } from './config';

/** Broadcast lifecycle statuses (used for the list filter). */
export const BROADCAST_STATUSES = ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED'] as const;
export type BroadcastStatus = (typeof BROADCAST_STATUSES)[number];

/** Per-recipient delivery channels and statuses. */
export const DELIVERY_CHANNELS = ['EMAIL', 'IN_APP'] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];
export const DELIVERY_STATUSES = ['PENDING', 'SENT', 'FAILED', 'BOUNCED'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/**
 * Audience targeting. `audience_filters` accepts a `roles` array, e.g.
 * `{ "roles": ["partner"] }`. An empty filter ({}) targets everyone. The
 * composer shows the live estimate so the recipient count is confirmed before
 * sending.
 */
export type BroadcastAudience = 'all' | 'customers' | 'partners';
export const BROADCAST_AUDIENCES: { value: BroadcastAudience; label: string; hint: string; filters: Record<string, unknown> }[] = [
  { value: 'all', label: 'Everyone', hint: 'All users and partners', filters: {} },
  { value: 'customers', label: 'Customers (User App)', hint: 'Customer accounts only', filters: { roles: ['customer'] } },
  { value: 'partners', label: 'Partners (Partner Portal)', hint: 'Partner accounts only', filters: { roles: ['partner'] } },
];

export interface BroadcastListItem {
  id: string;
  title: string;
  status: string;
  send_email: boolean;
  send_in_app: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  estimated_recipients: number | null;
  total_recipients: number | null;
  total_sent: number | null;
  total_failed: number | null;
  created_by_name: string;
  created_at: string;
}

export interface BroadcastDetail extends BroadcastListItem {
  subject: string;
  body: string;
  action_url: string | null;
  audience_filters: Record<string, unknown> | string | null;
  cancelled_at: string | null;
  cancelled_by_name: string | null;
  /** Channel/status counts, e.g. { email_sent: 10, in_app_sent: 8 } — shape varies. */
  delivery_stats: Record<string, unknown> | null;
  updated_at: string;
}

export interface BroadcastDelivery {
  id: string;
  email: string;
  channel: string;
  status: string;
  sent_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface CreateBroadcastInput {
  title: string;
  subject: string;
  body: string;
  action_url?: string;
  send_email: boolean;
  send_in_app: boolean;
  audience_filters?: Record<string, unknown>;
  /** ISO datetime to schedule; omit/null to send immediately. */
  scheduled_at?: string | null;
}

export interface ListBroadcastsParams {
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface DeliveriesParams {
  channel?: string;
  status?: string;
}

/** Normalize an array-or-paginated response into a plain array. */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { results?: T[] }).results)) {
    return (res as { results: T[] }).results;
  }
  return [];
}

/** Generic paginated fetch that follows every page (docs may show a bare array). */
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

/** GET /broadcasts/ — list broadcasts (filterable by date range and status). */
export function listBroadcasts(params?: ListBroadcastsParams): Promise<BroadcastListItem[]> {
  return fetchAllPages<BroadcastListItem>(adminPath('broadcasts/'), (params ?? {}) as Record<string, string | undefined>);
}

/** POST /broadcasts/ — create and trigger (no scheduled_at) or schedule a broadcast. */
export function createBroadcast(input: CreateBroadcastInput): Promise<BroadcastDetail> {
  return api.post<BroadcastDetail>(adminPath('broadcasts/'), input);
}

/** GET /broadcasts/{id}/ — full detail with delivery stats. */
export function getBroadcast(broadcastId: string): Promise<BroadcastDetail> {
  return api.get<BroadcastDetail>(adminPath(`broadcasts/${broadcastId}/`));
}

/** POST /broadcasts/{id}/cancel/ — cancel a scheduled or in-progress broadcast. */
export function cancelBroadcast(broadcastId: string): Promise<BroadcastDetail> {
  return api.post<BroadcastDetail>(adminPath(`broadcasts/${broadcastId}/cancel/`));
}

/** GET /broadcasts/{id}/deliveries/ — per-recipient deliveries (filter channel/status). */
export function listDeliveries(broadcastId: string, params?: DeliveriesParams): Promise<BroadcastDelivery[]> {
  return fetchAllPages<BroadcastDelivery>(adminPath(`broadcasts/${broadcastId}/deliveries/`), (params ?? {}) as Record<string, string | undefined>);
}

/** POST /broadcasts/{id}/send-test/ — send a test delivery to the requesting admin only. */
export function sendBroadcastTest(broadcastId: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`broadcasts/${broadcastId}/send-test/`));
}

/** POST /broadcasts/estimate/ — estimate the audience size for the given filters. */
export function estimateAudience(audienceFilters: Record<string, unknown>): Promise<{ count: number }> {
  return api.post<{ count: number }>(adminPath('broadcasts/estimate/'), { audience_filters: audienceFilters });
}

// --- Display helpers ---

/** Humanize a status code, e.g. `IN_PROGRESS` / `SCHEDULED` -> "Scheduled". */
export function broadcastStatusLabel(status: string): string {
  if (!status) return '—';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Tailwind badge classes (text + bg) for a broadcast status. */
export function broadcastStatusTone(status: string): string {
  switch (status?.toUpperCase()) {
    case 'SENT':
      return 'bg-green-50 text-green-600';
    case 'SCHEDULED':
      return 'bg-blue-50 text-blue-600';
    case 'SENDING':
      return 'bg-amber-50 text-amber-700';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-500';
    case 'FAILED':
      return 'bg-red-50 text-red-600';
    case 'DRAFT':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

/** Tailwind badge classes for a per-recipient delivery status. */
export function deliveryStatusTone(status: string): string {
  switch (status?.toUpperCase()) {
    case 'SENT':
      return 'bg-green-50 text-green-600';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700';
    case 'FAILED':
      return 'bg-red-50 text-red-600';
    case 'BOUNCED':
      return 'bg-orange-50 text-orange-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

/** True for statuses where a broadcast can still be cancelled. */
export function isBroadcastCancellable(status: string): boolean {
  const s = status?.toUpperCase();
  return s === 'SCHEDULED' || s === 'SENDING';
}
