import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserAppAlignment from './UserAppAlignment';

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

const { authState } = vi.hoisted(() => ({ authState: { manage: true, tlb: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (p: string) => (p === 'MANAGE_LISTINGS' ? authState.manage : p === 'MANAGE_TLB_LISTINGS' ? authState.tlb : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
  ALIGNMENT_PAGES: [
    { id: 'homepage', label: 'App Homepage', screen: null, listingType: null, permission: 'MANAGE_LISTINGS', base: 'listings/homepage-sections/' },
    { id: 'events', label: 'Events', screen: 'events', listingType: 'event', permission: 'MANAGE_TLB_LISTINGS', base: 'listings/discovery-sections/events/' },
  ],
  listSections: vi.fn(),
  getSectionRows: vi.fn(),
  addToSection: vi.fn(() => Promise.resolve({})),
  removeFromSection: vi.fn(() => Promise.resolve({})),
  setSection: vi.fn(() => Promise.resolve({})),
  listListings: vi.fn(() => Promise.resolve([])),
  sectionLabel: (slug: string, label?: string) => label ?? slug,
  sectionErrorMessage: (code: string | null, fallback: string) => (code ? `ERR:${code}` : fallback),
  SECTION_MIN_LISTINGS: 4,
  SECTION_MAX_LISTINGS: 10,
  TLB_SIGNATURE_SECTION: 'tlb_signature',
  listingTypeLabel: (t: string) => t,
  listingTypeTone: () => 'bg-blue-50 text-blue-600',
  listingStatusLabel: (s: string) => s,
  listingStatusTone: () => 'bg-green-50 text-green-600',
  LISTING_TYPES: ['event', 'venue', 'program', 'class'],
  ApiError: class ApiError extends Error { code: string | null = null; constructor(m: string, code: string | null = null) { super(m); this.code = code; } },
}));
import {
  listSections,
  getSectionRows,
  addToSection,
  removeFromSection,
  setSection,
  listListings,
  ApiError,
} from '../../shared/lib/api';

const SECTIONS = [
  { section: 'featured', label: 'Featured', total_count: 5, published_count: 5 },
  { section: 'tlb_signature', label: 'TLB Signature', total_count: 2, published_count: 2 },
];

function makeItems(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    sort_order: i + 1,
    added_at: '2026-06-01T00:00:00Z',
    listing: {
      id: `l${i + 1}`, title: `Listing ${i + 1}`, listing_type: 'event', status: 'published',
      is_paused: false, is_tlb_signature: false, published_at: '2026-06-01T00:00:00Z', created_at: '2026-06-01T00:00:00Z',
    },
  }));
}

describe('UserAppAlignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.manage = true; authState.tlb = true;
    (listSections as any).mockResolvedValue(SECTIONS);
    (getSectionRows as any).mockResolvedValue(makeItems(5));
    (listListings as any).mockResolvedValue([]);
  });

  it('blocks access without any manage permission', async () => {
    authState.manage = false; authState.tlb = false;
    render(<UserAppAlignment />);
    expect(await screen.findByText('No access')).toBeInTheDocument();
    expect(listSections).not.toHaveBeenCalled();
  });

  it('renders the page selector and loads the homepage page by default', async () => {
    render(<UserAppAlignment />);
    expect(screen.getByText('UserApp Alignment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /App Homepage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Events/i })).toBeInTheDocument();
    await waitFor(() => expect(listSections).toHaveBeenCalledWith('listings/homepage-sections/'));
    await waitFor(() => expect(getSectionRows).toHaveBeenCalledWith('listings/homepage-sections/', 'featured'));
    expect((await screen.findAllByText('Listing 1')).length).toBeGreaterThanOrEqual(1);
  });

  it('switches to the Events discovery screen', async () => {
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getByRole('button', { name: /Events/i }));
    await waitFor(() => expect(listSections).toHaveBeenCalledWith('listings/discovery-sections/events/'));
    await waitFor(() => expect(getSectionRows).toHaveBeenCalledWith('listings/discovery-sections/events/', 'featured'));
  });

  it('shows the TLB Signature hint on that homepage section', async () => {
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getAllByText('TLB Signature')[0]);
    expect(await screen.findByText(/only TLB Signature listings/i)).toBeInTheDocument();
  });

  it('removes a listing', async () => {
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getAllByLabelText('Remove from section')[0]);
    await waitFor(() => expect(removeFromSection).toHaveBeenCalledWith('listings/homepage-sections/', 'featured', 'l1'));
  });

  it('disables remove at the minimum count', async () => {
    (getSectionRows as any).mockResolvedValue(makeItems(4));
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    screen.getAllByLabelText('Remove from section').forEach((b) => expect(b).toBeDisabled());
  });

  it('reorders via move-down using the set endpoint', async () => {
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getAllByLabelText('Move down')[0]);
    await waitFor(() => expect(setSection).toHaveBeenCalledWith('listings/homepage-sections/', 'featured', ['l2', 'l1', 'l3', 'l4', 'l5']));
  });

  it('disables Add Listing when the section is at maximum', async () => {
    (getSectionRows as any).mockResolvedValue(makeItems(10));
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    expect(screen.getByRole('button', { name: /Add Listing/i })).toBeDisabled();
  });

  it('opens the picker and adds a published listing', async () => {
    (listListings as any).mockResolvedValue([
      { id: 'new-1', title: 'Fresh Event', listing_type: 'event', status: 'published', is_paused: false, partner_name: '', partner_email: '', category: null, city: 'Pune', created_at: '', updated_at: '' },
    ]);
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getByRole('button', { name: /Add Listing/i }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Fresh Event')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(addToSection).toHaveBeenCalledWith('listings/homepage-sections/', 'featured', 'new-1'));
  });

  it('filters the picker by listing type on a discovery screen', async () => {
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getByRole('button', { name: /Events/i }));
    await waitFor(() => expect(getSectionRows).toHaveBeenCalledWith('listings/discovery-sections/events/', 'featured'));
    await userEvent.click(screen.getByRole('button', { name: /Add Listing/i }));
    await waitFor(() => expect(listListings).toHaveBeenCalledWith(expect.objectContaining({ status: 'published', listing_type: 'event' })));
  });

  it('surfaces a mapped error when a mutation fails', async () => {
    (removeFromSection as any).mockRejectedValue(new (ApiError as any)('boom', 'MINIMUM_LISTINGS_REQUIRED'));
    render(<UserAppAlignment />);
    await screen.findAllByText('Listing 1');
    await userEvent.click(screen.getAllByLabelText('Remove from section')[0]);
    expect(await screen.findByText('ERR:MINIMUM_LISTINGS_REQUIRED')).toBeInTheDocument();
  });
});
