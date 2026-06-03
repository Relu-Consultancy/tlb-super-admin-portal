import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    it('navigates to the Create Coupon screen when the button is clicked', () => {
        const onCreateCoupon = vi.fn();
        render(<CouponsMarketing onCreateCoupon={onCreateCoupon} />);
        fireEvent.click(screen.getByText('Create Coupon'));
        expect(onCreateCoupon).toHaveBeenCalledTimes(1);
    });

    it('does not crash when no navigation handler is provided', () => {
        render(<CouponsMarketing />);
        fireEvent.click(screen.getByText('Create Coupon'));
        // No modal is rendered inline anymore — creation lives on its own screen.
        expect(screen.queryByText('Create New Coupon')).not.toBeInTheDocument();
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
