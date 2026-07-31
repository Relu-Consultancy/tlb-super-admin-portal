import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrafficEngagement from './TrafficEngagement';

describe('TrafficEngagement', () => {
    it('renders the header and KPI cards', () => {
        render(<TrafficEngagement />);
        expect(screen.getByRole('heading', { name: /Traffic & Engagement/i })).toBeInTheDocument();
        expect(screen.getByText('App visits')).toBeInTheDocument();
        expect(screen.getByText('9,840')).toBeInTheDocument();
        expect(screen.getByText('Live now — app')).toBeInTheDocument();
        expect(screen.getByText('184')).toBeInTheDocument();
    });

    it('renders the three breakdown columns with their rows', () => {
        render(<TrafficEngagement />);
        expect(screen.getByText('Most viewed pages')).toBeInTheDocument();
        expect(screen.getByText('Where customers drop off')).toBeInTheDocument();
        expect(screen.getByText('Traffic sources')).toBeInTheDocument();
        expect(screen.getByText('Checkout — payment step')).toBeInTheDocument();
        expect(screen.getByText('Organic / App search')).toBeInTheDocument();
        expect(screen.getByText('38%')).toBeInTheDocument();
    });

    it('renders push engagement and the top-viewed listings table', () => {
        render(<TrafficEngagement />);
        expect(screen.getByText('Push notification engagement')).toBeInTheDocument();
        expect(screen.getByText('Push sent')).toBeInTheDocument();
        expect(screen.getByText('12,400')).toBeInTheDocument();
        expect(screen.getByText('Top viewed listings')).toBeInTheDocument();
        expect(screen.getByText('Storytime carnival')).toBeInTheDocument();
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
