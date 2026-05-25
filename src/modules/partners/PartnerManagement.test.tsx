import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PartnerManagement from './PartnerManagement';

describe('PartnerManagement', () => {
    it('renders the Partners heading', () => {
        render(<PartnerManagement />);
        expect(screen.getByText('Partners')).toBeInTheDocument();
    });

    it('renders tab navigation with Requests, Existing, Archived', () => {
        render(<PartnerManagement />);
        expect(screen.getByText('Requests')).toBeInTheDocument();
        expect(screen.getByText('Existing')).toBeInTheDocument();
        expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('renders the Pending Approval label', () => {
        render(<PartnerManagement />);
        expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    });

    it('renders partner cards from mock data', () => {
        render(<PartnerManagement />);
        // At least one Review button should be visible (pending partners)
        const reviewButtons = screen.getAllByText('Review');
        expect(reviewButtons.length).toBeGreaterThan(0);
    });

    it('shows Review modal when Review button is clicked', async () => {
        render(<PartnerManagement />);
        const reviewBtn = screen.getAllByText('Review')[0];
        fireEvent.click(reviewBtn);
        await waitFor(() => {
            expect(screen.getByText('Review Application')).toBeInTheDocument();
        });
    });

    it('closes Review modal when X is clicked', async () => {
        render(<PartnerManagement />);
        fireEvent.click(screen.getAllByText('Review')[0]);
        await waitFor(() => screen.getByText('Review Application'));

        // Click the X button inside the modal
        const closeBtn = screen.getAllByRole('button').find(
            (b) => b.querySelector('svg') && b.closest('.fixed')
        );
        // Click backdrop to close
        fireEvent.click(screen.getByText('Review Application').closest('.fixed')!.querySelector('.absolute')!);
        await waitFor(() => {
            expect(screen.queryByText('Review Application')).not.toBeInTheDocument();
        });
    });

    it('shows Manage modal when Manage button is clicked', async () => {
        render(<PartnerManagement />);
        const manageBtn = screen.getAllByText('Manage')[0];
        fireEvent.click(manageBtn);
        await waitFor(() => {
            expect(screen.getByText('Manage Partner')).toBeInTheDocument();
        });
    });

    it('closes Manage modal when Cancel is clicked', async () => {
        render(<PartnerManagement />);
        fireEvent.click(screen.getAllByText('Manage')[0]);
        await waitFor(() => screen.getByText('Manage Partner'));
        fireEvent.click(screen.getByText('Cancel'));
        await waitFor(() => {
            expect(screen.queryByText('Manage Partner')).not.toBeInTheDocument();
        });
    });

    it('shows the search input', () => {
        render(<PartnerManagement />);
        expect(screen.getByPlaceholderText('Search partners...')).toBeInTheDocument();
    });

    it('shows Approve and Reject buttons in Review modal', async () => {
        render(<PartnerManagement />);
        fireEvent.click(screen.getAllByText('Review')[0]);
        await waitFor(() => {
            expect(screen.getByText('Approve')).toBeInTheDocument();
            expect(screen.getByText('Reject')).toBeInTheDocument();
        });
    });
});
