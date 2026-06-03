import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from './LandingPage';

describe('LandingPage', () => {
    it('renders the hero headline', () => {
        render(<LandingPage onGetStarted={vi.fn()} />);
        expect(screen.getByText(/command center for/i)).toBeInTheDocument();
    });

    it('renders the feature cards', () => {
        render(<LandingPage onGetStarted={vi.fn()} />);
        expect(screen.getByText('Event Approvals')).toBeInTheDocument();
        expect(screen.getByText('Finance & Payouts')).toBeInTheDocument();
    });

    it('calls onGetStarted when the primary CTA is clicked', async () => {
        const onGetStarted = vi.fn();
        render(<LandingPage onGetStarted={onGetStarted} />);
        await userEvent.click(screen.getByRole('button', { name: /login to dashboard/i }));
        expect(onGetStarted).toHaveBeenCalledTimes(1);
    });

    it('calls onGetStarted from the header Login button', async () => {
        const onGetStarted = vi.fn();
        render(<LandingPage onGetStarted={onGetStarted} />);
        await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
        expect(onGetStarted).toHaveBeenCalledTimes(1);
    });
});
