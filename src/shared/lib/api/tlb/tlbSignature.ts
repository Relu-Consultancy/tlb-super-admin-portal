/**
 * Admin TLB Signature Listings service — `/api/v1/admin/listings/tlb-signature/`.
 *
 * TLB Signature listings are first-party listings authored by admins (not
 * partners). This service covers the full lifecycle:
 *   list (search / status / type filters) · detail · per-type create
 *   (event | class | program | venue, each a distinct payload) · partial
 *   update · pause/unpause visibility · archive (soft delete).
 *
 * Permission: MANAGE_TLB_LISTINGS.
 */

import { api } from '../core/client';
import { adminPath } from '../core/config';

const BASE = 'listings/tlb-signature/';

/** Statuses the list endpoint can filter by. */
export const TLB_STATUSES = ['published', 'archived'] as const;
export type TlbStatus = (typeof TLB_STATUSES)[number];

/** The four creatable TLB Signature listing types. */
export const TLB_CREATE_TYPES = ['event', 'class', 'program', 'venue'] as const;
export type TlbCreateType = (typeof TLB_CREATE_TYPES)[number];

/** Row shape from the list endpoint. */
export interface TlbListItem {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  is_paused: boolean;
  is_tlb_signature: boolean;
  category: string | null;
  city: string | null;
  created_by_admin_email: string | null;
  created_at: string;
  updated_at: string;
}

/** Full TLB Signature listing. `details`/`media` shapes vary — render defensively. */
export interface TlbDetail {
  id: string;
  title: string;
  short_description: string;
  description: string;
  listing_type: string;
  status: string;
  is_paused: boolean;
  is_tlb_signature: boolean;
  cancellation_cutoff_hours: number | null;
  published_at: string | null;
  created_by_admin_email: string | null;
  details: unknown;
  media: unknown;
  created_at: string;
  updated_at: string;
}

export interface ListTlbParams {
  search?: string;
  /** published | archived */
  status?: string;
  /** event | venue | program | class */
  type?: string;
}

// --- Create payloads (one per type) ---

interface TlbBaseInput {
  title: string;
  short_description?: string;
  description?: string;
  cancellation_cutoff_hours?: number;
  category_id?: number;
  subcategory_id?: number;
  terms_and_conditions?: string;
}

export interface TlbEventTicket {
  name: string;
  price: string;
  total_quantity: number;
  description?: string;
  is_default?: boolean;
}
export interface TlbEventInput extends TlbBaseInput {
  format?: string;
  start_datetime?: string;
  end_datetime?: string;
  registration_deadline?: string;
  mode?: string;
  city?: string;
  area?: string;
  address?: string;
  meeting_link?: string;
  price_type?: string;
  capacity?: number;
  tickets: TlbEventTicket[];
  age_group?: { type: string; min_age: number; max_age: number };
}

export interface TlbClassBatch {
  name: string;
  days: string[];
  start_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
}
export interface TlbClassInput extends TlbBaseInput {
  mode?: string;
  min_age?: number;
  max_age?: number;
  city?: string;
  area?: string;
  address?: string;
  meeting_link?: string;
  price?: string;
  tags?: string[];
  teaser_video_url?: string;
  cancellation_policy?: string;
  refund_policy?: string;
  booking_type?: string;
  is_live?: boolean;
  batches: TlbClassBatch[];
}

export interface TlbProgramBatch {
  name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  fee: string;
  total_seats: number;
  days: string[];
}
export interface TlbProgramInput extends TlbBaseInput {
  program_format?: string;
  delivery_mode?: string;
  city?: string;
  area?: string;
  address?: string;
  meeting_link?: string;
  latitude?: string;
  longitude?: string;
  min_age?: number;
  max_age?: number;
  max_capacity?: number;
  total_hours?: number;
  module_count?: number;
  booking_type?: string;
  batches: TlbProgramBatch[];
}

export interface TlbVenuePackage {
  name: string;
  price: string;
  description?: string;
  duration_minutes: number;
  max_guests: number;
}
export interface TlbVenueInput extends TlbBaseInput {
  location_type?: string;
  city?: string;
  area?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  min_age?: number;
  max_age?: number;
  min_capacity?: number;
  max_capacity?: number;
  booking_type?: string;
  packages: TlbVenuePackage[];
}

/** Partial update — only supplied fields change. */
export type TlbUpdateInput = Record<string, unknown>;

/** Normalize an array-or-paginated response into a plain array. */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { results?: T[] }).results)) {
    return (res as { results: T[] }).results;
  }
  return [];
}

/** GET tlb-signature/ — list (follows pagination if the backend paginates). */
export async function listTlbSignature(params?: ListTlbParams): Promise<TlbListItem[]> {
  const base = (params ?? {}) as Record<string, string | undefined>;
  const first = await api.get<unknown>(adminPath(BASE), { params: { ...base, page_size: 100 } });
  if (Array.isArray(first)) return first as TlbListItem[];

  const all = asArray<TlbListItem>(first);
  const count = (first as { count?: unknown })?.count;
  if (typeof count !== 'number') return all;
  for (let page = 2; all.length < count && page < 100; page++) {
    const res = await api.get<unknown>(adminPath(BASE), { params: { ...base, page_size: 100, page } });
    const rows = asArray<TlbListItem>(res);
    if (rows.length === 0) break;
    all.push(...rows);
  }
  return all;
}

/** GET tlb-signature/{id}/ — full detail. */
export function getTlbSignature(id: string): Promise<TlbDetail> {
  return api.get<TlbDetail>(adminPath(`${BASE}${id}/`));
}

/** DELETE tlb-signature/{id}/archive/ — soft delete (status → ARCHIVED). */
export function archiveTlbSignature(id: string): Promise<unknown> {
  return api.delete(adminPath(`${BASE}${id}/archive/`));
}

/** PATCH tlb-signature/{id}/update/ — partial update. */
export function updateTlbSignature(id: string, patch: TlbUpdateInput): Promise<TlbDetail> {
  return api.patch<TlbDetail>(adminPath(`${BASE}${id}/update/`), patch);
}

/** PATCH tlb-signature/{id}/visibility/ — toggle pause/unpause (published only). */
export function toggleTlbVisibility(id: string): Promise<TlbDetail> {
  return api.patch<TlbDetail>(adminPath(`${BASE}${id}/visibility/`));
}

/** POST tlb-signature/events/create/ */
export function createTlbEvent(input: TlbEventInput): Promise<TlbDetail> {
  return api.post<TlbDetail>(adminPath(`${BASE}events/create/`), input);
}
/** POST tlb-signature/classes/create/ */
export function createTlbClass(input: TlbClassInput): Promise<TlbDetail> {
  return api.post<TlbDetail>(adminPath(`${BASE}classes/create/`), input);
}
/** POST tlb-signature/programs/create/ */
export function createTlbProgram(input: TlbProgramInput): Promise<TlbDetail> {
  return api.post<TlbDetail>(adminPath(`${BASE}programs/create/`), input);
}
/** POST tlb-signature/venues/create/ */
export function createTlbVenue(input: TlbVenueInput): Promise<TlbDetail> {
  return api.post<TlbDetail>(adminPath(`${BASE}venues/create/`), input);
}

// --- Display helpers ---

/** Friendly label for the documented error codes. */
export const TLB_ERROR_LABELS: Record<string, string> = {
  TLB_LISTING_NOT_FOUND: "That TLB Signature listing couldn't be found.",
  ALREADY_ARCHIVED: 'This listing is already archived.',
  LISTING_NOT_PUBLISHED: 'Only published listings can be paused or unpaused.',
  TICKETS_REQUIRED: 'Add at least one ticket type for the event.',
  VALIDATION_ERROR: 'Some fields are invalid. Please review and try again.',
};

export function tlbErrorMessage(code: string | null | undefined, fallback: string): string {
  if (code && TLB_ERROR_LABELS[code]) return TLB_ERROR_LABELS[code];
  return fallback;
}
