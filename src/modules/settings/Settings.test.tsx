import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';

vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({
        admin: {
            full_name: 'Vishesh Srivastava',
            email: 'super_admin@gmail.com',
            role: 'SUPER_ADMIN',
            department: 'Engineering',
            avatar: null,
        },
        logoutAll: vi.fn(),
    }),
}));

describe('Settings', () => {
    it('renders the Settings heading', () => {
        render(<Settings />);
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders the sub-heading', () => {
        render(<Settings />);
        expect(screen.getByText('Manage your account and platform preferences')).toBeInTheDocument();
    });

    it('renders Profile Information section', () => {
        render(<Settings />);
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    it('shows the authenticated admin name and email', () => {
        render(<Settings />);
        expect(screen.getByDisplayValue('Vishesh Srivastava')).toBeInTheDocument();
        expect(screen.getByDisplayValue('super_admin@gmail.com')).toBeInTheDocument();
    });

    it('shows the admin role and department', () => {
        render(<Settings />);
        expect(screen.getByDisplayValue('Super Admin')).toBeInTheDocument(); // role label
        expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
    });

    it('renders the Security section with an Update Password button', () => {
        render(<Settings />);
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Update Password')).toBeInTheDocument();
    });

    it('renders Two-Factor Authentication panel', () => {
        render(<Settings />);
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
        expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
    });

    it('renders Platform Notifications section', () => {
        render(<Settings />);
        expect(screen.getByText('Platform Notifications')).toBeInTheDocument();
    });

    it('renders all notification toggle items', () => {
        render(<Settings />);
        expect(screen.getByText('New Partner Requests')).toBeInTheDocument();
        expect(screen.getByText('Event Approval Alerts')).toBeInTheDocument();
        expect(screen.getByText('System Maintenance')).toBeInTheDocument();
    });

    it('shows a confirm step for logging out all devices', async () => {
        render(<Settings />);
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /log out all devices/i }));
        expect(screen.getByRole('button', { name: /confirm log out/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
});
