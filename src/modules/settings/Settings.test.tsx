import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Settings from './Settings';

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

    it('renders Full Name label and input with default value', () => {
        render(<Settings />);
        expect(screen.getByText('Full Name')).toBeInTheDocument();
        const nameInput = screen.getByDisplayValue('Alex Rivera');
        expect(nameInput).toBeInTheDocument();
    });

    it('renders Email Address label and input with default value', () => {
        render(<Settings />);
        expect(screen.getByText('Email Address')).toBeInTheDocument();
        const emailInput = screen.getByDisplayValue('alex.rivera@tlb.com');
        expect(emailInput).toBeInTheDocument();
    });

    it('renders the Save Changes button', () => {
        render(<Settings />);
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('renders the Security section', () => {
        render(<Settings />);
        expect(screen.getByText('Security')).toBeInTheDocument();
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

    it('renders notification descriptions', () => {
        render(<Settings />);
        expect(screen.getByText('Get notified when a new partner applies')).toBeInTheDocument();
        expect(screen.getByText('Notifications for pending event reviews')).toBeInTheDocument();
        expect(screen.getByText('Updates about scheduled platform downtime')).toBeInTheDocument();
    });
});
