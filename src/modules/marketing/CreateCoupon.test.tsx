import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCoupon from './CreateCoupon';

vi.mock('motion/react', () => ({
    motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
}));

vi.mock('../../shared/lib/api', () => ({
    createCoupon: vi.fn(() => Promise.resolve({ id: 'c1', code: 'SAVE20' })),
    listPartners: vi.fn(() => Promise.resolve([{ id: 'p1', business_name: 'Alpha Co', email: 'a@x.com' }])),
    LISTING_TYPES: ['event', 'venue', 'program', 'class'],
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { createCoupon, listPartners } from '../../shared/lib/api';

describe('CreateCoupon', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (createCoupon as any).mockResolvedValue({ id: 'c1', code: 'SAVE20' });
        (listPartners as any).mockResolvedValue([{ id: 'p1', business_name: 'Alpha Co', email: 'a@x.com' }]);
    });

    it('renders the form with a Generate Coupon button', () => {
        render(<CreateCoupon onBack={vi.fn()} onCreated={vi.fn()} />);
        expect(screen.getByText('Create Coupon')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate Coupon/i })).toBeInTheDocument();
    });

    it('calls onBack from the back button', async () => {
        const onBack = vi.fn();
        render(<CreateCoupon onBack={onBack} onCreated={vi.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /Back to Coupons/i }));
        expect(onBack).toHaveBeenCalled();
    });

    it('requires a coupon code', async () => {
        render(<CreateCoupon onBack={vi.fn()} onCreated={vi.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /Generate Coupon/i }));
        expect(await screen.findByText('Coupon code is required.')).toBeInTheDocument();
        expect(createCoupon).not.toHaveBeenCalled();
    });

    it('rejects a percentage above 100', async () => {
        render(<CreateCoupon onBack={vi.fn()} onCreated={vi.fn()} />);
        await userEvent.type(screen.getByPlaceholderText('SAVE20'), 'BIG');
        await userEvent.type(screen.getByPlaceholderText('20'), '150');
        await userEvent.click(screen.getByRole('button', { name: /Generate Coupon/i }));
        expect(await screen.findByText('Percentage cannot exceed 100.')).toBeInTheDocument();
        expect(createCoupon).not.toHaveBeenCalled();
    });

    it('requires a partner for a partner coupon', async () => {
        render(<CreateCoupon onBack={vi.fn()} onCreated={vi.fn()} />);
        await userEvent.type(screen.getByPlaceholderText('SAVE20'), 'PART');
        await userEvent.type(screen.getByPlaceholderText('20'), '10');
        await userEvent.click(screen.getByRole('button', { name: /Partner/i }));
        await userEvent.click(screen.getByRole('button', { name: /Generate Coupon/i }));
        expect(await screen.findByText('Select a partner for a partner coupon.')).toBeInTheDocument();
    });

    it('creates a platform coupon with the right payload', async () => {
        const onCreated = vi.fn();
        render(<CreateCoupon onBack={vi.fn()} onCreated={onCreated} />);
        await userEvent.type(screen.getByPlaceholderText('SAVE20'), 'save20');
        await userEvent.type(screen.getByPlaceholderText('20'), '20');
        await userEvent.click(screen.getByRole('button', { name: /Generate Coupon/i }));
        await waitFor(() => expect(createCoupon).toHaveBeenCalledTimes(1));
        const payload = (createCoupon as any).mock.calls[0][0];
        expect(payload).toMatchObject({ code: 'SAVE20', discount_type: 'percent', discount_value: '20', is_active: true });
        expect(payload.partner_id).toBeUndefined();
        expect(await screen.findByText('Coupon created')).toBeInTheDocument();
    });
});
