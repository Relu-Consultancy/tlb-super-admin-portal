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
  listHomepageSections,
  getSectionListings,
  addListingToSection,
  removeListingFromSection,
  setSectionListings,
  sectionLabel,
  sectionErrorMessage,
  SECTION_MIN_LISTINGS,
  SECTION_MAX_LISTINGS,
} from './homepageSections';

describe('homepageSections service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists sections', async () => {
    (api.get as any).mockResolvedValue([{ section: 'featured', label: 'Featured', total_count: 5, published_count: 4 }]);
    const out = await listHomepageSections();
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/homepage-sections/');
    expect(out).toHaveLength(1);
  });

  it('gets section listings sorted by sort_order, passing search/type', async () => {
    (api.get as any).mockResolvedValue([
      { sort_order: 2, added_at: '', listing: { id: 'b' } },
      { sort_order: 1, added_at: '', listing: { id: 'a' } },
    ]);
    const out = await getSectionListings('featured', { search: 'jazz', type: 'event' });
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/homepage-sections/featured/', {
      params: { search: 'jazz', type: 'event' },
    });
    expect(out.map((i) => i.listing.id)).toEqual(['a', 'b']);
  });

  it('unwraps a paginated section response', async () => {
    (api.get as any).mockResolvedValue({ results: [{ sort_order: 1, added_at: '', listing: { id: 'a' } }] });
    const out = await getSectionListings('featured');
    expect(out).toHaveLength(1);
  });

  it('adds a listing with the body', async () => {
    await addListingToSection('featured', 'lid-1');
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/homepage-sections/featured/add/', { listing_id: 'lid-1' });
  });

  it('removes a listing via the remove path', async () => {
    await removeListingFromSection('featured', 'lid-1');
    expect(api.delete).toHaveBeenCalledWith('/api/v1/admin/listings/homepage-sections/featured/lid-1/remove/');
  });

  it('sets (replaces + reorders) listings with an ordered id list', async () => {
    await setSectionListings('featured', ['a', 'b', 'c', 'd']);
    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/listings/homepage-sections/featured/set/', {
      listing_ids: ['a', 'b', 'c', 'd'],
    });
  });

  it('labels a slug when the API omits a label', () => {
    expect(sectionLabel('tlb_signature')).toBe('Tlb Signature');
    expect(sectionLabel('featured', 'Featured Picks')).toBe('Featured Picks');
  });

  it('maps documented error codes to friendly text', () => {
    expect(sectionErrorMessage('LISTING_NOT_PUBLISHED', 'x')).toMatch(/published/i);
    expect(sectionErrorMessage('TLB_SIGNATURE_ONLY', 'x')).toMatch(/Signature/i);
    expect(sectionErrorMessage('MINIMUM_LISTINGS_REQUIRED', 'x')).toContain(String(SECTION_MIN_LISTINGS));
    expect(sectionErrorMessage('MAXIMUM_LISTINGS_EXCEEDED', 'x')).toContain(String(SECTION_MAX_LISTINGS));
    expect(sectionErrorMessage('SOMETHING_ELSE', 'fallback text')).toBe('fallback text');
    expect(sectionErrorMessage(null, 'fallback text')).toBe('fallback text');
  });
});
