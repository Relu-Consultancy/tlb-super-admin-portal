import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TlbSignature from './TlbSignature';

vi.mock('motion/react', async () => {
  const React = await import('react');
  const cache: Record<string, any> = {};
  return {
    motion: new Proxy({}, { get(_: any, tag: string) {
      if (!cache[tag]) cache[tag] = ({ children, ...p }: any) => { const { initial, animate, exit, transition, layoutId, ...rest } = p; return React.createElement(tag as any, rest, children); };
      return cache[tag];
    } }),
    AnimatePresence: ({ children }: any) => children,
  };
});

const { authState } = vi.hoisted(() => ({ authState: { tlb: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (p: string) => (p === 'MANAGE_TLB_LISTINGS' ? authState.tlb : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
  listTlbSignature: vi.fn(),
  getTlbSignature: vi.fn(),
  archiveTlbSignature: vi.fn(() => Promise.resolve({})),
  updateTlbSignature: vi.fn(() => Promise.resolve({})),
  toggleTlbVisibility: vi.fn(() => Promise.resolve({})),
  tlbErrorMessage: (code: string | null, fallback: string) => (code ? `ERR:${code}` : fallback),
  listingTypeLabel: (t: string) => t,
  listingTypeTone: () => 'bg-blue-50 text-blue-600',
  listingStatusLabel: (s: string) => s,
  listingStatusTone: () => 'bg-green-50 text-green-600',
  LISTING_TYPES: ['event', 'venue', 'program', 'class'],
  TLB_STATUSES: ['published', 'archived'],
  ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listTlbSignature, getTlbSignature, archiveTlbSignature, toggleTlbVisibility } from '../../shared/lib/api';

const LIST = [
  { id: 'l1', title: 'Sunset Gala', listing_type: 'event', status: 'published', is_paused: false, is_tlb_signature: true, category: 'Music', city: 'Pune', created_by_admin_email: 'admin@x.com', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
];
const DETAIL = { id: 'l1', title: 'Sunset Gala', short_description: 'An evening', description: 'Full desc', listing_type: 'event', status: 'published', is_paused: false, is_tlb_signature: true, cancellation_cutoff_hours: 24, published_at: '2026-06-02T00:00:00Z', created_by_admin_email: 'admin@x.com', details: null, media: null, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' };

describe('TlbSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.tlb = true;
    (listTlbSignature as any).mockResolvedValue(LIST);
    (getTlbSignature as any).mockResolvedValue(DETAIL);
  });

  it('blocks access without MANAGE_TLB_LISTINGS', async () => {
    authState.tlb = false;
    render(<TlbSignature />);
    expect(await screen.findByText('No access')).toBeInTheDocument();
    expect(listTlbSignature).not.toHaveBeenCalled();
  });

  it('lists listings and calls Create', async () => {
    const onCreate = vi.fn();
    render(<TlbSignature onCreate={onCreate} />);
    expect(await screen.findByText('Sunset Gala')).toBeInTheDocument();
    await waitFor(() => expect(listTlbSignature).toHaveBeenCalled());
    await userEvent.click(screen.getByRole('button', { name: /Create Listing/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('opens the detail drawer and pauses', async () => {
    render(<TlbSignature />);
    await userEvent.click(await screen.findByLabelText('View details'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(getTlbSignature).toHaveBeenCalledWith('l1'));
    await userEvent.click(within(dialog).getByRole('button', { name: /^Pause$/i }));
    await waitFor(() => expect(toggleTlbVisibility).toHaveBeenCalledWith('l1'));
  });

  it('archives from the detail drawer', async () => {
    render(<TlbSignature />);
    await userEvent.click(await screen.findByLabelText('View details'));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Sunset Gala');
    await userEvent.click(within(dialog).getByRole('button', { name: /Archive/i }));
    await waitFor(() => expect(archiveTlbSignature).toHaveBeenCalledWith('l1'));
  });

  it('filters by type', async () => {
    render(<TlbSignature />);
    await screen.findByText('Sunset Gala');
    const filterBar = screen.getByText('All types').closest('.relative') as HTMLElement;
    await userEvent.click(screen.getByText('All types'));
    await userEvent.click(await within(filterBar).findByText('event'));
    await waitFor(() => expect(listTlbSignature).toHaveBeenCalledWith(expect.objectContaining({ type: 'event' })));
  });
});
