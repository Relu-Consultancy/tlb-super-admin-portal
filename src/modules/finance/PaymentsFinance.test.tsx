import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentsFinance from './PaymentsFinance';

describe('PaymentsFinance', () => {
    it('renders the Payments & Finance heading', () => {
        render(<PaymentsFinance />);
        expect(screen.getByText('Payments & Finance')).toBeInTheDocument();
    });

    it('renders the tab navigation', () => {
        render(<PaymentsFinance />);
        expect(screen.getByText('Transactions')).toBeInTheDocument();
        expect(screen.getByText('Payouts')).toBeInTheDocument();
        expect(screen.getByText('Refunds')).toBeInTheDocument();
    });

    it('renders the transaction table headers', () => {
        render(<PaymentsFinance />);
        expect(screen.getByText('Transaction ID')).toBeInTheDocument();
        expect(screen.getByText('User / Partner')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders transaction rows from mock data', () => {
        render(<PaymentsFinance />);
        // Transactions from mock data should appear in the table
        const rows = screen.getAllByRole('row');
        // header row + data rows
        expect(rows.length).toBeGreaterThan(1);
    });

    it('renders the search input', () => {
        render(<PaymentsFinance />);
        expect(screen.getByPlaceholderText('Search by Transaction ID or User...')).toBeInTheDocument();
    });

    it('renders Register button in Transactions tab', () => {
        render(<PaymentsFinance />);
        expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('opens Register Transaction modal when Register is clicked', async () => {
        render(<PaymentsFinance />);
        fireEvent.click(screen.getByText('Register'));
        await waitFor(() => {
            expect(screen.getByText('Register Transaction')).toBeInTheDocument();
        });
    });

    it('closes Register modal when Cancel is clicked', async () => {
        render(<PaymentsFinance />);
        fireEvent.click(screen.getByText('Register'));
        await waitFor(() => screen.getByText('Register Transaction'));
        fireEvent.click(screen.getByText('Cancel'));
        await waitFor(() => {
            expect(screen.queryByText('Register Transaction')).not.toBeInTheDocument();
        });
    });

    it('opens Filter modal when Filters button is clicked', async () => {
        render(<PaymentsFinance />);
        fireEvent.click(screen.getByText('Filters'));
        await waitFor(() => {
            expect(screen.getByText('Filter Transactions')).toBeInTheDocument();
        });
    });

    it('closes Filter modal when Apply is clicked', async () => {
        render(<PaymentsFinance />);
        fireEvent.click(screen.getByText('Filters'));
        await waitFor(() => screen.getByText('Filter Transactions'));
        fireEvent.click(screen.getByText('Apply'));
        await waitFor(() => {
            expect(screen.queryByText('Filter Transactions')).not.toBeInTheDocument();
        });
    });

    it('shows pagination controls', () => {
        render(<PaymentsFinance />);
        expect(screen.getByText('Showing 1-10 of 248 transactions')).toBeInTheDocument();
    });
});
