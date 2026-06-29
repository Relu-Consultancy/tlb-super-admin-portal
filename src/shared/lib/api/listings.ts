/**
 * Admin Listing Moderation service — `/api/v1/admin/listings/`.
 *
 * The unified moderation API across every listing type (event | venue |
 * program | class):
 *   list (filter by type / status / partner / title search) · stats (with a
 *   by_type breakdown) · full detail (type-specific `details` block + media +
 *   latest review) · approve (pending → published) · reject (pending →
 *   rejected, with comment) · visibility toggle (pause/unpause published) ·
 *   review history.
 *
 * Supersedes the events-only `/admin/events/` endpoint.
 */

import { api } from './client';
import { adminPath } from './config';

/** The listing types the platform moderates. */
export const LISTING_TYPES = ['event', 'venue', 'program', 'class'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

/** Known listing statuses. */
export const LISTING_STATUSES = ['draft', 'pending', 'published', 'rejected', 'archived'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/**
 * A category reference. The API is inconsistent: it may return a bare name
 * string or a `{ id, name }` object — handle both.
 */
export interface CategoryRef {
  id: number;
  name: string;
}
export type ListingCategory = string | CategoryRef | null;

/** Resolve a category field (string | {id,name} | null) to its display name. */
export function listingCategoryName(category: ListingCategory | undefined): string {
  if (!category) return '';
  if (typeof category === 'string') return category;
  if (typeof category === 'object' && 'name' in category) return String(category.name ?? '');
  return '';
}

/** Row shape returned by the list endpoint. */
export interface ListingListItem {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  is_paused: boolean;
  partner_name: string;
  partner_email: string;
  category: ListingCategory;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface ListingMedia {
  id?: number | string;
  file?: string;
  media_type?: string;
  [key: string]: unknown;
}

export interface ListingReviewLog {
  id: number;
  decision: string;
  comment: string;
  reviewed_by_email: string;
  created_at: string;
}

/** Full listing from the detail endpoint. */
export interface ListingDetail {
  id: string;
  title: string;
  short_description: string;
  description: string;
  listing_type: string;
  status: string;
  is_paused: boolean;
  published_at: string | null;
  partner_id: string;
  partner_name: string;
  partner_email: string;
  /** Type-specific fields (shape varies by listing_type) — rendered generically. */
  details: Record<string, unknown> | null;
  media: ListingMedia[];
  latest_review: ListingReviewLog | null;
  created_at: string;
  updated_at: string;
}

export interface ListingStats {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  archived: number;
  total: number;
  /** Count per listing_type (only present when no type filter is applied). */
  by_type?: Record<string, number>;
}

export interface ListListingsParams {
  /** event | venue | program | class */
  listing_type?: string;
  /** Filter by partner UUID. */
  partner_id?: string;
  /** Case-insensitive title search. */
  search?: string;
  /** draft | pending | published | rejected | archived */
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

/**
 * GET /listings/ — every listing across all types and partners.
 *
 * Follows pagination (the docs show a bare array but the backend may paginate)
 * so the UI never silently truncates.
 */
export async function listListings(params?: ListListingsParams): Promise<ListingListItem[]> {
  const base = (params ?? {}) as Record<string, string | number | boolean | undefined>;
  const first = await api.get<unknown>(adminPath('listings/'), { params: { ...base, page_size: 100 } });
  if (Array.isArray(first)) return first as ListingListItem[];

  const all = asArray<ListingListItem>(first);
  const count = (first as { count?: unknown })?.count;
  if (typeof count !== 'number') return all;

  for (let page = 2; all.length < count && page < 100; page++) {
    const res = await api.get<unknown>(adminPath('listings/'), { params: { ...base, page_size: 100, page } });
    const rows = asArray<ListingListItem>(res);
    if (rows.length === 0) break;
    all.push(...rows);
  }
  return all;
}

/** GET /listings/stats/ — counts by status, plus a by_type breakdown when unscoped. */
export function getListingStats(listingType?: string): Promise<ListingStats> {
  return api.get<ListingStats>(adminPath('listings/stats/'), {
    params: listingType ? { listing_type: listingType } : undefined,
  });
}

/** GET /listings/{id}/ — full detail (type-specific details, media, latest review). */
export async function getListing(listingId: string): Promise<ListingDetail> {
  const res = await api.get<ListingDetail>(adminPath(`listings/${listingId}/`));
  const rawDetails = (res as { details?: unknown }).details;
  return {
    ...res,
    media: asArray<ListingMedia>((res as { media?: unknown }).media),
    details: rawDetails && typeof rawDetails === 'object' && !Array.isArray(rawDetails)
      ? (rawDetails as Record<string, unknown>)
      : null,
  };
}

/** GET /listings/{id}/history/ — approve/reject decisions, newest first. */
export async function getListingHistory(listingId: string): Promise<ListingReviewLog[]> {
  const res = await api.get<unknown>(adminPath(`listings/${listingId}/history/`));
  return asArray<ListingReviewLog>(res);
}

/** POST /listings/{id}/approve/ — pending → published (emails the partner). */
export function approveListing(listingId: string): Promise<ListingDetail> {
  return api.post<ListingDetail>(adminPath(`listings/${listingId}/approve/`));
}

/** POST /listings/{id}/reject/ — pending → rejected. Comment stored + emailed. */
export function rejectListing(listingId: string, comment: string): Promise<ListingDetail> {
  return api.post<ListingDetail>(adminPath(`listings/${listingId}/reject/`), { comment });
}

/**
 * PATCH /listings/{id}/visibility/ — set `is_paused` on a published listing.
 * Paused listings stay published but are hidden from public discovery.
 */
export function setListingVisibility(listingId: string, isPaused: boolean): Promise<ListingDetail> {
  return api.patch<ListingDetail>(adminPath(`listings/${listingId}/visibility/`), { is_paused: isPaused });
}

// --- Display helpers ---

/** Humanize a status code, e.g. `pending` -> "Pending". */
export function listingStatusLabel(status: string): string {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Tailwind badge classes (text + bg) for a listing status. */
export function listingStatusTone(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-green-50 text-green-600';
    case 'pending':
      return 'bg-amber-50 text-amber-700';
    case 'rejected':
      return 'bg-red-50 text-red-600';
    case 'draft':
      return 'bg-gray-100 text-gray-500';
    case 'archived':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

/** Humanize a listing type, e.g. `event` -> "Event". */
export function listingTypeLabel(type: string): string {
  if (!type) return '—';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Tailwind badge classes (text + bg) for a listing type. */
export function listingTypeTone(type: string): string {
  switch (type) {
    case 'event':
      return 'bg-blue-50 text-blue-600';
    case 'venue':
      return 'bg-purple-50 text-purple-600';
    case 'program':
      return 'bg-teal-50 text-teal-600';
    case 'class':
      return 'bg-pink-50 text-pink-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}
