/**
 * Admin Homepage Sections service — `/api/v1/admin/listings/homepage-sections/`.
 *
 * Drives the "UserApp Alignment" screen: the admin curates which published
 * listings appear in each homepage section of the consumer app (e.g. featured,
 * trending, tlb_signature).
 *
 * Endpoints:
 *   GET    homepage-sections/                          — sections + counts
 *   GET    homepage-sections/{slug}/                   — ordered listings in a section
 *   POST   homepage-sections/{slug}/add/               — append one listing
 *   DELETE homepage-sections/{slug}/{listing_id}/remove/ — drop one listing
 *   PUT    homepage-sections/{slug}/set/               — replace + reorder (4–10)
 *
 * Backend rules surfaced as typed error codes (see SECTION_ERROR_LABELS):
 *   · each section holds 4–10 listings (MINIMUM/MAXIMUM_LISTINGS)
 *   · only published listings can be placed (LISTING_NOT_PUBLISHED)
 *   · the `tlb_signature` section accepts only TLB Signature listings
 *     (TLB_SIGNATURE_ONLY)
 */

import { api } from './client';
import { adminPath } from './config';

/** Min/max listings a homepage section may hold (enforced server-side on mutate). */
export const SECTION_MIN_LISTINGS = 4;
export const SECTION_MAX_LISTINGS = 10;

const BASE = 'listings/homepage-sections/';

/** A homepage section with its current occupancy. */
export interface HomepageSection {
  section: string;
  label: string;
  total_count: number;
  published_count: number;
}

/** The compact listing shape returned inside a section row. */
export interface SectionListingRef {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  is_paused: boolean;
  is_tlb_signature: boolean;
  published_at: string | null;
  created_at: string;
}

/** One placement of a listing within a section (carries its sort order). */
export interface SectionListing {
  sort_order: number;
  added_at: string;
  listing: SectionListingRef;
}

export interface SectionListingsParams {
  /** Search by listing title. */
  search?: string;
  /** Filter by listing type: event | venue | program | class. */
  type?: string;
}

/**
 * Normalize a list response into a plain array.
 *
 * The section-detail endpoint doesn't return the bare array the docs promise —
 * it wraps the rows inside an object (e.g. `{ section, listings: [...] }`). So
 * we check the common collection keys, then fall back to the first
 * array-of-objects value found on the object.
 */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (!res || typeof res !== 'object') return [];
  const obj = res as Record<string, unknown>;

  for (const key of ['results', 'listings', 'items', 'data']) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  // Last resort: any property holding an array of objects.
  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'object')) {
      return value as T[];
    }
  }
  return [];
}

/** GET homepage-sections/ — every section with its total/published counts. */
export async function listHomepageSections(): Promise<HomepageSection[]> {
  const res = await api.get<unknown>(adminPath(BASE));
  return asArray<HomepageSection>(res);
}

/** GET homepage-sections/{slug}/ — listings in a section, in display order. */
export async function getSectionListings(
  slug: string,
  params?: SectionListingsParams,
): Promise<SectionListing[]> {
  const res = await api.get<unknown>(adminPath(`${BASE}${slug}/`), {
    params: params as Record<string, string | undefined> | undefined,
  });
  const rows = asArray<SectionListing>(res);
  // Defensive: present in display order even if the backend doesn't pre-sort.
  return rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/** POST homepage-sections/{slug}/add/ — append a single published listing. */
export function addListingToSection(slug: string, listingId: string): Promise<unknown> {
  return api.post(adminPath(`${BASE}${slug}/add/`), { listing_id: listingId });
}

/** DELETE homepage-sections/{slug}/{listingId}/remove/ — drop one listing. */
export function removeListingFromSection(slug: string, listingId: string): Promise<unknown> {
  return api.delete(adminPath(`${BASE}${slug}/${listingId}/remove/`));
}

/**
 * PUT homepage-sections/{slug}/set/ — replace the whole section with an ordered
 * list of 4–10 listing IDs. Used for reordering and bulk curation.
 */
export function setSectionListings(slug: string, listingIds: string[]): Promise<unknown> {
  return api.put(adminPath(`${BASE}${slug}/set/`), { listing_ids: listingIds });
}

// --- Display helpers ---

/** Human-friendly fallback label for a section slug (when the API omits one). */
export function sectionLabel(slug: string, label?: string): string {
  if (label) return label;
  if (!slug) return '—';
  return slug
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** The `tlb_signature` section only accepts TLB Signature listings. */
export const TLB_SIGNATURE_SECTION = 'tlb_signature';

/** Maps the documented mutation error codes to readable messages. */
export const SECTION_ERROR_LABELS: Record<string, string> = {
  INVALID_SECTION: 'That homepage section no longer exists.',
  LISTING_NOT_FOUND: "That listing couldn't be found.",
  LISTING_NOT_IN_SECTION: 'That listing is not in this section.',
  ALREADY_IN_SECTION: 'That listing is already in this section.',
  LISTING_NOT_PUBLISHED: 'Only published listings can appear on the homepage.',
  TLB_SIGNATURE_ONLY: 'This section accepts only TLB Signature listings.',
  MINIMUM_LISTINGS_REQUIRED: `A section must keep at least ${SECTION_MIN_LISTINGS} listings.`,
  MAXIMUM_LISTINGS_EXCEEDED: `A section can hold at most ${SECTION_MAX_LISTINGS} listings.`,
};

/** Resolve a thrown ApiError code to a friendly message, with a fallback. */
export function sectionErrorMessage(code: string | null | undefined, fallback: string): string {
  if (code && SECTION_ERROR_LABELS[code]) return SECTION_ERROR_LABELS[code];
  return fallback;
}
