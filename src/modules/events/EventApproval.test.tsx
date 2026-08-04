import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventApproval from './EventApproval';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                if (!cache[tag]) {
                    cache[tag] = ({ children, ...props }: any) => {
                        const { initial, animate, exit, transition, layoutId, ...rest } = props;
                        return React.createElement(tag as any, rest, children);
                    };
                }
                return cache[tag];
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

const { authState } = vi.hoisted(() => ({ authState: { manage: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({
        hasPermission: (p: string) => (p === 'MANAGE_LISTINGS' ? authState.manage : false),
    }),
}));

vi.mock('../../shared/lib/api', () => ({
    listListings: vi.fn(),
    getListingStats: vi.fn(),
    getListing: vi.fn(),
    getListingHistory: vi.fn(() => Promise.resolve([])),
    approveListing: vi.fn(() => Promise.resolve({})),
    rejectListing: vi.fn(() => Promise.resolve({})),
    getListingRejectionReasons: vi.fn(() => Promise.resolve([])),
    setListingVisibility: vi.fn(() => Promise.resolve({})),
    listingStatusLabel: (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'),
    listingStatusTone: () => 'bg-gray-100 text-gray-600',
    listingTypeLabel: (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'),
    listingTypeTone: () => 'bg-gray-100 text-gray-600',
    listingCategoryName: (c: any) => (!c ? '' : typeof c === 'string' ? c : c.name ?? ''),
    mediaUrl: (p: string) => p,
    LISTING_TYPES: ['event', 'venue', 'program', 'class'],
    LISTING_STATUSES: ['draft', 'pending', 'published', 'rejected', 'archived'],
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listListings, getListing, getListingStats, approveListing, rejectListing, setListingVisibility } from '../../shared/lib/api';

const STATS = { draft: 2, pending: 3, published: 5, rejected: 1, archived: 0, total: 11, by_type: { event: 6, venue: 3, program: 1, class: 1 } };

const LISTINGS = [
    // category as { id, name } — the real API shape (docs say "string").
    { id: 'l-1', title: 'Summer Jam', listing_type: 'event', status: 'pending', is_paused: false, partner_name: 'Alpha Events', partner_email: 'alpha@tlb.dev', category: { id: 5, name: 'Music' }, city: 'Mumbai', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z' },
    { id: 'l-2', title: 'Royal Garden', listing_type: 'venue', status: 'published', is_paused: true, partner_name: 'Beta Studios', partner_email: 'beta@tlb.dev', category: 'Outdoor', city: 'Delhi', created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-02T00:00:00Z' },
];

const PENDING_DETAIL = {
    id: 'l-1', title: 'Summer Jam', short_description: 'Live music', description: 'A great show', listing_type: 'event', status: 'pending', is_paused: false, published_at: null,
    partner_id: 'p-1', partner_name: 'Alpha Events', partner_email: 'alpha@tlb.dev',
    details: {
        start_datetime: '2026-07-01T18:00:00Z',
        capacity: 500,
        booking_type: 'direct_booking',
        category: { id: 22, name: 'Grooming & Personality Development' },
        tickets: [{ name: 'Early Bird', price: 149 }],
    },
    media: [{ id: 1, file: '/media/cover.png', media_type: 'image/png' }],
    latest_review: null, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z',
};

const PUBLISHED_PAUSED_DETAIL = { ...PENDING_DETAIL, id: 'l-2', title: 'Royal Garden', listing_type: 'venue', status: 'published', is_paused: true, published_at: '2026-06-10T00:00:00Z', details: { capacity: 200 } };

describe('Listings Approval', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.manage = true;
        (listListings as any).mockResolvedValue(LISTINGS);
        (getListingStats as any).mockResolvedValue(STATS);
        (getListing as any).mockResolvedValue(PENDING_DETAIL);
    });

    it('renders the heading and stats', async () => {
        render(<EventApproval />);
        expect(screen.getByText('Listings Approval')).toBeInTheDocument();
        // "Live" is the guide term for a published listing (unique stat tile).
        expect(await screen.findByText('Live')).toBeInTheDocument();
        expect(await screen.findByText('11')).toBeInTheDocument();
    });

    it('shows the by_type breakdown', async () => {
        render(<EventApproval />);
        // by_type tile values render (6 events, 3 venues)
        expect(await screen.findByText('6')).toBeInTheDocument();
    });

    it('lists listings of multiple types with type badges', async () => {
        render(<EventApproval />);
        expect(await screen.findByText('Summer Jam')).toBeInTheDocument();
        expect(screen.getByText('Royal Garden')).toBeInTheDocument();
        // "Venue" shows in the by_type tile, the filter option, and the row badge.
        expect(screen.getAllByText('Venue').length).toBeGreaterThanOrEqual(1);
    });

    it('renders an object-shaped category by name without crashing', async () => {
        render(<EventApproval />);
        expect(await screen.findByText('Music')).toBeInTheDocument();
    });

    it('sends listing_type and search filters to the API', async () => {
        render(<EventApproval />);
        await screen.findByText('Summer Jam');
        // The type filter is a custom dropdown: open the "All types" trigger, pick the option.
        await userEvent.click(screen.getByText('All types'));
        await userEvent.click(screen.getByRole('button', { name: 'Venue' }));
        await waitFor(() =>
            expect(listListings).toHaveBeenCalledWith(expect.objectContaining({ listing_type: 'venue' })),
        );
    });

    it('pre-filters to the listing vertical passed via props', async () => {
        render(<EventApproval listingType="class" />);
        await waitFor(() =>
            expect(listListings).toHaveBeenCalledWith(expect.objectContaining({ listing_type: 'class' })),
        );
        // Header reflects the scoped vertical.
        expect(screen.getByRole('heading', { name: /Class Approval/i })).toBeInTheDocument();
    });

    it('shows an empty state when no listings match', async () => {
        (listListings as any).mockResolvedValue([]);
        render(<EventApproval />);
        expect(await screen.findByText('No listings found')).toBeInTheDocument();
    });

    it('opens the review page and renders type-specific details generically', async () => {
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        await waitFor(() => expect(getListing).toHaveBeenCalledWith('l-1'));
        expect(await screen.findByText('Moderation')).toBeInTheDocument();
        // details block humanizes keys from the type-specific `details` object
        expect(screen.getByText('Start Datetime')).toBeInTheDocument();
        expect(screen.getByText('Capacity')).toBeInTheDocument();
    });

    it('formats enum detail values as Title Case', async () => {
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        await screen.findByText('Moderation');
        // booking_type: 'direct_booking' -> "Direct Booking"
        expect(screen.getByText('Direct Booking')).toBeInTheDocument();
    });

    it('renders a {id,name} reference detail as a chip showing the name', async () => {
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        await screen.findByText('Moderation');
        expect(screen.getByText('Grooming & Personality Development')).toBeInTheDocument();
        expect(screen.getByText('#22')).toBeInTheDocument();
    });

    it('opens a lightbox when a media image is clicked', async () => {
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        const preview = await screen.findByRole('button', { name: /Preview image/i });
        expect(screen.queryByRole('button', { name: /Close preview/i })).not.toBeInTheDocument();
        await userEvent.click(preview);
        expect(await screen.findByRole('button', { name: /Close preview/i })).toBeInTheDocument();
    });

    it('approves a pending listing', async () => {
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        await userEvent.click(await screen.findByRole('button', { name: /Approve & Publish/i }));
        await waitFor(() => expect(approveListing).toHaveBeenCalledWith('l-1'));
    });

    it('requires a reason to reject', async () => {
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        await userEvent.click(await screen.findByRole('button', { name: /Reject Listing/i }));
        const buttons = await screen.findAllByRole('button', { name: 'Reject Listing' });
        const confirm = buttons[buttons.length - 1];
        expect(confirm).toBeDisabled();
        await userEvent.type(screen.getByPlaceholderText(/describe the issues/i), 'Incomplete details');
        expect(confirm).not.toBeDisabled();
        await userEvent.click(confirm);
        await waitFor(() => expect(rejectListing).toHaveBeenCalledWith('l-1', 'Incomplete details', undefined));
    });

    it('shows an unpause action for a paused published listing', async () => {
        (getListing as any).mockResolvedValue(PUBLISHED_PAUSED_DETAIL);
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Royal Garden'));
        const unpause = await screen.findByRole('button', { name: /Unpause/i });
        await userEvent.click(unpause);
        await waitFor(() => expect(setListingVisibility).toHaveBeenCalledWith('l-2', false));
    });

    it('hides moderation actions without MANAGE_LISTINGS', async () => {
        authState.manage = false;
        render(<EventApproval />);
        await userEvent.click(await screen.findByText('Summer Jam'));
        expect(await screen.findByText(/read-only access to listings/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Approve & Publish/i })).not.toBeInTheDocument();
    });

    it('hides the header and type filter when lockType is set (embedded in a vertical dashboard)', async () => {
        render(<EventApproval listingType="event" lockType />);
        await screen.findByText('Summer Jam');
        expect(screen.queryByText('Listings Approval')).not.toBeInTheDocument();
        expect(screen.queryByText('Event Approval')).not.toBeInTheDocument();
        expect(screen.queryByText('All types')).not.toBeInTheDocument();
        // Still scopes the query to the given type.
        expect(listListings).toHaveBeenCalledWith(expect.objectContaining({ listing_type: 'event' }));
    });

    it('shows the header and type filter when not locked', async () => {
        render(<EventApproval />);
        await screen.findByText('Summer Jam');
        expect(screen.getByText('Listings Approval')).toBeInTheDocument();
        expect(screen.getByText('All types')).toBeInTheDocument();
    });

    it('paginates the table 10 rows per page and pages with Prev/Next', async () => {
        const many = Array.from({ length: 15 }, (_, i) => ({
            id: `l-${i}`, title: `Listing ${i}`, listing_type: 'event', status: 'pending', is_paused: false,
            partner_name: 'Alpha Events', partner_email: 'alpha@tlb.dev', category: 'Music', city: 'Mumbai',
            created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z',
        }));
        (listListings as any).mockResolvedValue(many);
        render(<EventApproval />);

        await screen.findByText('Listing 0');
        expect(screen.getByText('Listing 9')).toBeInTheDocument();
        expect(screen.queryByText('Listing 10')).not.toBeInTheDocument();
        expect(screen.getByText('15 listings · page 1 of 2')).toBeInTheDocument();

        const prev = screen.getByRole('button', { name: /Prev/i });
        const next = screen.getByRole('button', { name: /Next/i });
        expect(prev).toBeDisabled();

        await userEvent.click(next);
        expect(screen.getByText('Listing 10')).toBeInTheDocument();
        expect(screen.queryByText('Listing 0')).not.toBeInTheDocument();
        expect(screen.getByText('15 listings · page 2 of 2')).toBeInTheDocument();
        expect(next).toBeDisabled();

        await userEvent.click(prev);
        expect(screen.getByText('Listing 0')).toBeInTheDocument();
    });

    it('resets to page 1 when the search filter changes', async () => {
        const many = Array.from({ length: 15 }, (_, i) => ({
            id: `l-${i}`, title: `Listing ${i}`, listing_type: 'event', status: 'pending', is_paused: false,
            partner_name: 'Alpha Events', partner_email: 'alpha@tlb.dev', category: 'Music', city: 'Mumbai',
            created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z',
        }));
        (listListings as any).mockResolvedValue(many);
        render(<EventApproval />);

        await screen.findByText('Listing 0');
        await userEvent.click(screen.getByRole('button', { name: /Next/i }));
        expect(await screen.findByText(/page 2 of 2/)).toBeInTheDocument();

        await userEvent.type(screen.getByPlaceholderText('Search by title…'), 'x');
        await waitFor(() => expect(screen.getByText(/page 1 of/)).toBeInTheDocument());
    });
});
