import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CouponsMarketing from './CouponsMarketing';

describe('CouponsMarketing', () => {
    it('renders the Coupons & Marketing heading', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('Coupons & Marketing')).toBeInTheDocument();
    });

    it('renders the sub-heading', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('Manage discounts and promotional campaigns')).toBeInTheDocument();
    });

    it('renders Active Coupons section', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('Active Coupons')).toBeInTheDocument();
    });

    it('shows an empty state when there are no coupons', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('No coupons yet')).toBeInTheDocument();
    });

    it('renders the Create Coupon button', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('Create Coupon')).toBeInTheDocument();
    });

    it('opens Create Coupon modal when button is clicked', async () => {
        render(<CouponsMarketing />);
        fireEvent.click(screen.getByText('Create Coupon'));
        await waitFor(() => {
            expect(screen.getByText('Create New Coupon')).toBeInTheDocument();
        });
    });

    it('renders Generate Coupon button in the modal', async () => {
        render(<CouponsMarketing />);
        fireEvent.click(screen.getByText('Create Coupon'));
        await waitFor(() => {
            expect(screen.getByText('Generate Coupon')).toBeInTheDocument();
        });
    });

    it('closes modal when backdrop is clicked', async () => {
        render(<CouponsMarketing />);
        fireEvent.click(screen.getByText('Create Coupon'));
        await waitFor(() => screen.getByText('Create New Coupon'));

        // Click the backdrop overlay
        const backdrop = document.querySelector('.fixed .absolute')!;
        fireEvent.click(backdrop);
        await waitFor(() => {
            expect(screen.queryByText('Create New Coupon')).not.toBeInTheDocument();
        });
    });

    it('renders Marketing Tips panel', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('Marketing Tips')).toBeInTheDocument();
    });

    it('renders Quick Stats panel', () => {
        render(<CouponsMarketing />);
        expect(screen.getByText('Quick Stats')).toBeInTheDocument();
        expect(screen.getByText('Total Discount Given')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    });
});
