import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrafficEngagement from './TrafficEngagement';

const { authState } = vi.hoisted(() => ({ authState: { viewAnalytics: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: (p: string) => (p === 'VIEW_ANALYTICS' ? authState.viewAnalytics : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
    getActivitySummary: vi.fn(),
    getTopViewedListings: vi.fn(),
    analyticsErrorMessage: (_code: any, fallback: string) => fallback,
    listingTypeLabel: (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'),
    listingTypeTone: () => 'bg-blue-50 text-blue-600',
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { getActivitySummary, getTopViewedListings } from '../../shared/lib/api';

const ACTIVITY = {
    period: { type: 'this_month', date_from: '2026-08-01', date_to: '2026-08-31', label: 'This Month' },
    customers: { total: 8, active: 3, inactive: 5, active_rate: 37.5 },
    partners: { total: 1, active: 0, inactive: 1, active_rate: 0.0 },
    customer_events: [],
    partner_events: [],
};

const TOP_VIEWED = {
    period: { type: 'this_month', date_from: '2026-08-01', date_to: '2026-08-31', label: 'This Month' },
    top_viewed_listings: [
        { listing_id: 'l1', listing_name: 'Weekend Art Workshop', vertical: 'class', views: 3, enquiries: 0, conversion_rate: 0.0 },
    ],
};

describe('TrafficEngagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.viewAnalytics = true;
        (getActivitySummary as any).mockResolvedValue(ACTIVITY);
        (getTopViewedListings as any).mockResolvedValue(TOP_VIEWED);
    });

    it('renders the header and still-unimplemented KPIs as Coming Soon', async () => {
        render(<TrafficEngagement />);
        expect(screen.getByRole('heading', { name: /Traffic & Engagement/i })).toBeInTheDocument();
        expect(screen.getByText('App visits')).toBeInTheDocument();
        expect(screen.getByText('Live now — app')).toBeInTheDocument();
        await waitFor(() => expect(getActivitySummary).toHaveBeenCalled());
        expect(screen.getAllByText('Coming Soon').length).toBeGreaterThanOrEqual(4); // App/Website visits + both Live now tiles
    });

    it('renders the three still-unimplemented breakdown columns', () => {
        render(<TrafficEngagement />);
        expect(screen.getByText('Most viewed pages')).toBeInTheDocument();
        expect(screen.getByText('Where customers drop off')).toBeInTheDocument();
        expect(screen.getByText('Traffic sources')).toBeInTheDocument();
        expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(3);
    });

    it('fills the Active customers/partners KPIs from the activity summary endpoint', async () => {
        render(<TrafficEngagement />);
        expect(await screen.findByText('Active customers')).toBeInTheDocument();
        expect(screen.getByText('37.5% active')).toBeInTheDocument();
        expect(screen.getByText('Active partners')).toBeInTheDocument();
        expect(screen.getByText('0% active')).toBeInTheDocument();
    });

    it('renders push engagement placeholders and the top-viewed listings table from the API', async () => {
        render(<TrafficEngagement />);
        expect(screen.getByText('Push notification engagement')).toBeInTheDocument();
        expect(screen.getByText('Push sent')).toBeInTheDocument();
        expect(screen.getByText('Top viewed listings')).toBeInTheDocument();
        expect(await screen.findByText('Weekend Art Workshop')).toBeInTheDocument();
        expect(screen.getByText('Class')).toBeInTheDocument();
    });

    it('falls back to the Coming Soon placeholder state without VIEW_ANALYTICS', async () => {
        authState.viewAnalytics = false;
        render(<TrafficEngagement />);
        expect(getActivitySummary).not.toHaveBeenCalled();
        expect(getTopViewedListings).not.toHaveBeenCalled();
        expect(screen.getByText('Active customers')).toBeInTheDocument();
        expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(6);
        expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(4); // 3 breakdown columns + top-viewed table body
    });

    it('switches the active standard period on click', () => {
        render(<TrafficEngagement />);
        // Default is "This Month"; the shared PeriodFilter marks the active pill white.
        expect(screen.getByRole('button', { name: 'This Month' })).toHaveClass('bg-white');
        const today = screen.getByRole('button', { name: 'As of Today' });
        fireEvent.click(today);
        expect(today).toHaveClass('bg-white');
        expect(screen.getByRole('button', { name: 'This Month' })).not.toHaveClass('bg-white');
    });
});
