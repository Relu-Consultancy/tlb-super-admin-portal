import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalHealthMetrics from './GlobalHealthMetrics';

vi.mock('../../../shared/lib/api', () => ({
    getUserMetrics: vi.fn(() => Promise.resolve({
        total_users: 100, active_users: 80, inactive_users: 20, deleted_users: 2,
        new_today: 3, new_this_week: 9, new_this_month: 25, by_auth_provider: { otp: 60, google: 40 },
    })),
}));

describe('GlobalHealthMetrics', () => {
    it('renders the ZONE 1 heading', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText(/ZONE 1: Global Health Metrics/)).toBeInTheDocument();
    });

    it('renders the metric labels', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Total Registered Users')).toBeInTheDocument();
        expect(screen.getByText('Inactive Accounts')).toBeInTheDocument();
    });

    it('renders a disabled broadcast button without a navigation callback', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByRole('button', { name: /New Broadcast/i })).toBeDisabled();
    });

    it('navigates to Broadcasts when the button is clicked', async () => {
        const onBroadcast = vi.fn();
        const { default: userEvent } = await import('@testing-library/user-event');
        render(<GlobalHealthMetrics onBroadcast={onBroadcast} />);
        const btn = screen.getByRole('button', { name: /New Broadcast/i });
        expect(btn).not.toBeDisabled();
        await userEvent.click(btn);
        expect(onBroadcast).toHaveBeenCalled();
    });
});
