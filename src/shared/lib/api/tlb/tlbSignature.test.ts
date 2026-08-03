import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  api: {
    get: vi.fn(() => Promise.resolve([])),
    post: vi.fn(() => Promise.resolve({})),
    patch: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
  ApiError: class ApiError extends Error {},
}));
import { api } from '../core/client';
import {
  listTlbSignature,
  getTlbSignature,
  archiveTlbSignature,
  updateTlbSignature,
  toggleTlbVisibility,
  createTlbEvent,
  createTlbClass,
  createTlbProgram,
  createTlbVenue,
  tlbErrorMessage,
} from './tlbSignature';

describe('tlbSignature service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists with filters + page_size', async () => {
    (api.get as any).mockResolvedValue([]);
    await listTlbSignature({ search: 'gala', status: 'published', type: 'event' });
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/', {
      params: { search: 'gala', status: 'published', type: 'event', page_size: 100 },
    });
  });

  it('gets a detail', async () => {
    await getTlbSignature('id-1');
    expect(api.get).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/id-1/');
  });

  it('archives via DELETE', async () => {
    await archiveTlbSignature('id-1');
    expect(api.delete).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/id-1/archive/');
  });

  it('updates via PATCH', async () => {
    await updateTlbSignature('id-1', { title: 'New' });
    expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/id-1/update/', { title: 'New' });
  });

  it('toggles visibility via PATCH', async () => {
    await toggleTlbVisibility('id-1');
    expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/id-1/visibility/');
  });

  it('creates each type at the right path', async () => {
    await createTlbEvent({ title: 'E', tickets: [] });
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/events/create/', { title: 'E', tickets: [] });
    await createTlbClass({ title: 'C', batches: [] });
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/classes/create/', { title: 'C', batches: [] });
    await createTlbProgram({ title: 'P', batches: [] });
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/programs/create/', { title: 'P', batches: [] });
    await createTlbVenue({ title: 'V', packages: [] });
    expect(api.post).toHaveBeenCalledWith('/api/v1/admin/listings/tlb-signature/venues/create/', { title: 'V', packages: [] });
  });

  it('maps documented error codes', () => {
    expect(tlbErrorMessage('TLB_LISTING_NOT_FOUND', 'x')).toMatch(/found/i);
    expect(tlbErrorMessage('ALREADY_ARCHIVED', 'x')).toMatch(/archived/i);
    expect(tlbErrorMessage('TICKETS_REQUIRED', 'x')).toMatch(/ticket/i);
    expect(tlbErrorMessage('LISTING_NOT_PUBLISHED', 'x')).toMatch(/published/i);
    expect(tlbErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
