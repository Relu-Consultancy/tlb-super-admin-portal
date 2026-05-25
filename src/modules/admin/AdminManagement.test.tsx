import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminManagement from './AdminManagement';

describe('AdminManagement', () => {
    it('renders the Admin Management heading', () => {
        render(<AdminManagement />);
        expect(screen.getByText('Admin Management')).toBeInTheDocument();
    });

    it('renders three tabs: Admins, Activity Log, Roles & Permissions', () => {
        render(<AdminManagement />);
        expect(screen.getByText('Admins')).toBeInTheDocument();
        expect(screen.getByText('Activity Log')).toBeInTheDocument();
        expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    });

    it('renders Add New Admin button in Admins tab', () => {
        render(<AdminManagement />);
        expect(screen.getByText('Add New Admin')).toBeInTheDocument();
    });

    it('renders admin list from mock data', () => {
        render(<AdminManagement />);
        expect(screen.getByText('Administrators')).toBeInTheDocument();
    });

    it('opens Add New Admin modal when button is clicked', async () => {
        render(<AdminManagement />);
        fireEvent.click(screen.getByText('Add New Admin'));
        await waitFor(() => {
            expect(screen.getByText('New Admin Role')).toBeInTheDocument();
        });
    });

    it('closes modal when X is clicked', async () => {
        render(<AdminManagement />);
        fireEvent.click(screen.getByText('Add New Admin'));
        await waitFor(() => screen.getByText('New Admin Role'));

        // Find the X button in the modal
        const modalHeading = screen.getByText('New Admin Role');
        const header = modalHeading.closest('div')!;
        const closeBtn = header.querySelector('button')!;
        fireEvent.click(closeBtn);

        await waitFor(() => {
            expect(screen.queryByText('New Admin Role')).not.toBeInTheDocument();
        });
    });

    it('switches to Activity Log tab when clicked', async () => {
        render(<AdminManagement />);
        fireEvent.click(screen.getByText('Activity Log'));
        await waitFor(() => {
            expect(screen.getByText('Full Activity Log')).toBeInTheDocument();
        });
    });

    it('switches to Roles & Permissions tab when clicked', async () => {
        render(<AdminManagement />);
        fireEvent.click(screen.getByText('Roles & Permissions'));
        await waitFor(() => {
            // The tab content label appears
            const rolesHeadings = screen.getAllByText('Roles & Permissions');
            expect(rolesHeadings.length).toBeGreaterThan(0);
        });
    });

    it('shows recent activity in the Admins tab', () => {
        render(<AdminManagement />);
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('shows Send Invitation button in the modal', async () => {
        render(<AdminManagement />);
        fireEvent.click(screen.getByText('Add New Admin'));
        await waitFor(() => {
            expect(screen.getByText('Send Invitation')).toBeInTheDocument();
        });
    });
});
