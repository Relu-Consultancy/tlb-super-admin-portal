/**
 * Admin Listing-Section curation — homepage + discovery screens.
 *
 * Two sibling APIs share an identical shape (sections of 4–10 published
 * listings, with add / remove / bulk-set / reorder):
 *
 *   · App homepage   `/admin/listings/homepage-sections/`
 *   · Discovery screen `/admin/listings/discovery-sections/<screen>/`
 *       screen ∈ events | classes | programs | venues — each accepts ONLY its
 *       matching listing type (event | class | program | venue).
 *
 * Every "page" below resolves to a base path; the CRUD functions take that base
 * so one implementation drives both APIs. Backend rules surface as typed error
 * codes (see SECTION_ERROR_LABELS).
 */

import { api } from './client';
import { adminPath } from './config';
import type { ListingType } from './listings';
import type { Permission } from './roles';

/** Min/max listings a section may hold (enforced server-side on mutate). */
export const SECTION_MIN_LISTINGS = 4;
export const SECTION_MAX_LISTINGS = 10;

/** The homepage `tlb_signature` section only accepts TLB Signature listings. */
export const TLB_SIGNATURE_SECTION = 'tlb_signature';

/** A curatable page: the app homepage, or one of the discovery screens. */
export type AlignmentPageId = 'homepage' | 'events' | 'classes' | 'programs' | 'venues';

export interface AlignmentPage {
  id: AlignmentPageId;
  label: string;
  /** Discovery screen slug; null for the app homepage. */
  screen: 'events' | 'classes' | 'programs' | 'venues' | null;
  /** Listing type a discovery screen accepts; null = any (homepage). */
  listingType: ListingType | null;
  /** Permission required to curate this page. */
  permission: Permission;
  /** API base path (under adminPath). */
  base: string;
}

/** The pages exposed by the UserApp Alignment screen, in display order. */
export const ALIGNMENT_PAGES: AlignmentPage[] = [
  { id: 'homepage', label: 'App Homepage', screen: null, listingType: null, permission: 'MANAGE_LISTINGS', base: 'listings/homepage-sections/' },
  { id: 'events', label: 'Events', screen: 'events', listingType: 'event', permission: 'MANAGE_TLB_LISTINGS', base: 'listings/discovery-sections/events/' },
  { id: 'classes', label: 'Classes', screen: 'classes', listingType: 'class', permission: 'MANAGE_TLB_LISTINGS', base: 'listings/discovery-sections/classes/' },
  { id: 'programs', label: 'Programs', screen: 'programs', listingType: 'program', permission: 'MANAGE_TLB_LISTINGS', base: 'listings/discovery-sections/programs/' },
  { id: 'venues', label: 'Venues', screen: 'venues', listingType: 'venue', permission: 'MANAGE_TLB_LISTINGS', base: 'listings/discovery-sections/venues/' },
];

/** A section with its current occupancy. */
export interface AlignmentSection {
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

/**
 * Normalize a list response into a plain array.
 *
 * The section-detail endpoints don't always return the bare array the docs
 * promise — they may wrap the rows inside an object (e.g. `{ listings: [...] }`).
 * Check the common collection keys, then fall back to the first
 * array-of-objects value on the object.
 */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (!res || typeof res !== 'object') return [];
  const obj = res as Record<string, unknown>;

  for (const key of ['results', 'listings', 'items', 'data']) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'object')) {
      return value as T[];
    }
  }
  return [];
}

/** GET <base> — every section on the page with its total/published counts. */
export async function listSections(base: string): Promise<AlignmentSection[]> {
  const res = await api.get<unknown>(adminPath(base));
  return asArray<AlignmentSection>(res);
}

/** GET <base><slug>/ — listings in a section, in display order. */
export async function getSectionRows(base: string, slug: string, search?: string): Promise<SectionListing[]> {
  const res = await api.get<unknown>(adminPath(`${base}${slug}/`), {
    params: search ? { search } : undefined,
  });
  const rows = asArray<SectionListing>(res);
  // Defensive: present in display order even if the backend doesn't pre-sort.
  return rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/** POST <base><slug>/add/ — append a single published listing. */
export function addToSection(base: string, slug: string, listingId: string): Promise<unknown> {
  return api.post(adminPath(`${base}${slug}/add/`), { listing_id: listingId });
}

/** DELETE <base><slug>/<listingId>/remove/ — drop one listing. */
export function removeFromSection(base: string, slug: string, listingId: string): Promise<unknown> {
  return api.delete(adminPath(`${base}${slug}/${listingId}/remove/`));
}

/** PUT <base><slug>/set/ — replace the section with an ordered list (4–10). */
export function setSection(base: string, slug: string, listingIds: string[]): Promise<unknown> {
  return api.put(adminPath(`${base}${slug}/set/`), { listing_ids: listingIds });
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

/** Maps the documented mutation error codes to readable messages. */
export const SECTION_ERROR_LABELS: Record<string, string> = {
  INVALID_SCREEN: 'That discovery screen no longer exists.',
  INVALID_SECTION: 'That section no longer exists.',
  LISTING_NOT_FOUND: "That listing couldn't be found.",
  LISTING_NOT_IN_SECTION: 'That listing is not in this section.',
  ALREADY_IN_SECTION: 'That listing is already in this section.',
  LISTING_NOT_PUBLISHED: 'Only published listings can be placed in a section.',
  LISTING_TYPE_MISMATCH: "That listing's type doesn't match this screen.",
  TLB_SIGNATURE_ONLY: 'This section accepts only TLB Signature listings.',
  MINIMUM_LISTINGS_REQUIRED: `A section must keep at least ${SECTION_MIN_LISTINGS} listings.`,
  MAXIMUM_LISTINGS_EXCEEDED: `A section can hold at most ${SECTION_MAX_LISTINGS} listings.`,
};

/** Resolve a thrown ApiError code to a friendly message, with a fallback. */
export function sectionErrorMessage(code: string | null | undefined, fallback: string): string {
  if (code && SECTION_ERROR_LABELS[code]) return SECTION_ERROR_LABELS[code];
  return fallback;
}
