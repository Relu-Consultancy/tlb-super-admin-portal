import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
    post: vi.fn(() => Promise.resolve({})),
    put: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
  ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
  ALIGNMENT_PAGES,
  listSections,
  getSectionRows,
  addToSection,
  removeFromSection,
  setSection,
  sectionLabel,
  sectionErrorMessage,
  SECTION_MIN_LISTINGS,
  SECTION_MAX_LISTINGS,
} from './listingSections';

const HOME = 'listings/homepage-sections/';
const EVENTS = 'listings/discovery-sections/events/';

describe('listingSections service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exposes the homepage + 4 discovery pages with correct bases/permissions', () => {
    expect(ALIGNMENT_PAGES.map((p) => p.id)).toEqual(['homepage', 'events', 'classes', 'programs', 'venues']);
    const home = ALIGNMENT_PAGES.find((p) => p.id === 'homepage')!;
    const events = ALIGNMENT_PAGES.find((p) => p.id === 'events')!;
    expect(home.base).toBe(HOME);
    expect(home.permission).toBe('MANAGE_LISTINGS');
    expect(events.base).toBe(EVENTS);
    expect(events.listingType).toBe('event');
    expect(events.permission).toBe('MANAGE_TLB_LISTINGS');
    // venues is the 10-section screen
    expect(ALIGNMENT_PAGES.find((p) => p.id === 'venues')!.listingType).toBe('venue');
  });

  it('lists sections for a page base', async () => {
    (api.get as any).mockResolvedValue([{ section: 'trending_events', label: 'Trending', total_count: 5, published_count: 4 }]);
    const out = await listSections(EVENTS);
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/discovery-sections/events/');
    expect(out).toHaveLength(1);
  });

  it('gets section rows sorted by sort_order, passing search', async () => {
    (api.get as any).mockResolvedValue([
      { sort_order: 2, added_at: '', listing: { id: 'b' } },
      { sort_order: 1, added_at: '', listing: { id: 'a' } },
    ]);
    const out = await getSectionRows(EVENTS, 'trending_events', 'jazz');
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/discovery-sections/events/trending_events/', {
      params: { search: 'jazz' },
    });
    expect(out.map((i) => i.listing.id)).toEqual(['a', 'b']);
  });

  it('unwraps a section detail object that nests rows under "listings"', async () => {
    (api.get as any).mockResolvedValue({
      section: 'spotlight', label: 'Spotlight', total_count: 2, published_count: 2,
      listings: [
        { sort_order: 1, added_at: '', listing: { id: 'a' } },
        { sort_order: 2, added_at: '', listing: { id: 'b' } },
      ],
    });
    const out = await getSectionRows(HOME, 'spotlight');
    expect(out.map((i) => i.listing.id)).toEqual(['a', 'b']);
  });

  it('adds / removes / sets via the right paths', async () => {
    await addToSection(EVENTS, 'trending_events', 'lid-1');
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/discovery-sections/events/trending_events/add/', { listing_id: 'lid-1' });

    await removeFromSection(EVENTS, 'trending_events', 'lid-1');
    expect(api.delete).toHaveBeenCalledWith('/api/v1/admin/listings/discovery-sections/events/trending_events/lid-1/remove/');

    await setSection(EVENTS, 'trending_events', ['a', 'b', 'c', 'd']);
    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/listings/discovery-sections/events/trending_events/set/', {
      listing_ids: ['a', 'b', 'c', 'd'],
    });
  });

  it('labels a slug when the API omits a label', () => {
    expect(sectionLabel('trending_events')).toBe('Trending Events');
    expect(sectionLabel('featured', 'Featured Picks')).toBe('Featured Picks');
  });

  it('maps documented error codes, including discovery-specific ones', () => {
    expect(sectionErrorMessage('LISTING_TYPE_MISMATCH', 'x')).toMatch(/type/i);
    expect(sectionErrorMessage('INVALID_SCREEN', 'x')).toMatch(/screen/i);
    expect(sectionErrorMessage('LISTING_NOT_PUBLISHED', 'x')).toMatch(/published/i);
    expect(sectionErrorMessage('MINIMUM_LISTINGS_REQUIRED', 'x')).toContain(String(SECTION_MIN_LISTINGS));
    expect(sectionErrorMessage('MAXIMUM_LISTINGS_EXCEEDED', 'x')).toContain(String(SECTION_MAX_LISTINGS));
    expect(sectionErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
