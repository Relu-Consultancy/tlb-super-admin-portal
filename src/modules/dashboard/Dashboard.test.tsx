import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { Screen } from '../../types';

vi.mock('../../shared/lib/api', () => ({
    getPartnerMetrics: vi.fn(() => Promise.resolve({
        total_partners: 9, approved: 7, under_review: 2, rejected: 0,
        activated_limited: 0, profile_created: 0, is_active_count: 7, is_verified_count: 7, new_this_month: 3,
    })),
    getUserMetrics: vi.fn(() => Promise.resolve({
        total_users: 8, active_users: 5, inactive_users: 3, deleted_users: 0,
        new_today: 1, new_this_week: 2, new_this_month: 4, by_auth_provider: { otp: 6, google: 2 },
    })),
}));

describe('Dashboard', () => {
    const mockSetScreen = vi.fn();

    beforeEach(() => {
        mockSetScreen.mockClear();
    });

    it('renders the Super Admin Dashboard heading', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    it('renders the Platform Overview section', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Platform Overview')).toBeInTheDocument();
    });

    it('renders the partner/user stat cards', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Total Partners')).toBeInTheDocument();
        expect(screen.getByText('Verified Partners')).toBeInTheDocument();
        expect(screen.getByText('New Partners (30d)')).toBeInTheDocument();
    });

    it('fills stat cards with values from the partner + user APIs', async () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        // total users = 8, total partners = 9, verified = 7, active users = 5
        expect(await screen.findByText('8')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    });

    it('renders All-time Statistics section', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('All-time Statistics')).toBeInTheDocument();
    });

    it('renders Quick Actions section', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Approve Partners')).toBeInTheDocument();
        expect(screen.getByText('Approve Events')).toBeInTheDocument();
        expect(screen.getByText('Team Management')).toBeInTheDocument();
        expect(screen.getByText('Open Tickets')).toBeInTheDocument();
    });

    it('renders System Status panel', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('Server Load')).toBeInTheDocument();
        expect(screen.getByText('API Latency')).toBeInTheDocument();
    });

    it('calls setScreen with PARTNER_MANAGEMENT when Approve Partners is clicked', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        fireEvent.click(screen.getByText('Approve Partners'));
        expect(mockSetScreen).toHaveBeenCalledWith(Screen.PARTNER_MANAGEMENT);
    });

    it('calls setScreen with EVENT_APPROVAL when Approve Events is clicked', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        fireEvent.click(screen.getByText('Approve Events'));
        expect(mockSetScreen).toHaveBeenCalledWith(Screen.EVENT_APPROVAL);
    });

    it('calls setScreen with SUPPORT_SYSTEM when Open Tickets is clicked', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        fireEvent.click(screen.getByText('Open Tickets'));
        expect(mockSetScreen).toHaveBeenCalledWith(Screen.SUPPORT_SYSTEM);
    });
});
