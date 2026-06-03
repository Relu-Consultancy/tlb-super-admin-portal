import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCoupon from './CreateCoupon';

// Stub motion so animated wrappers render as plain elements.
vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                if (!cache[tag]) {
                    cache[tag] = ({ children, ...props }: any) => {
                        const { initial, animate, exit, transition, layoutId, ...rest } = props;
                        return React.createElement(tag as any, rest, children);
                    };
                }
                return cache[tag];
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

vi.mock('../../shared/lib/api', () => ({
    createCoupon: vi.fn(() => Promise.resolve({ id: 'c1', code: 'SAVE20' })),
    ApiError: class ApiError extends Error {
        status = 0;
        code: string | null = null;
        get isNetworkError() { return this.status === 0; }
    },
}));

import { createCoupon, ApiError } from '../../shared/lib/api';

describe('CreateCoupon', () => {
    beforeEach(() => {
        (createCoupon as any).mockClear();
        (createCoupon as any).mockResolvedValue({ id: 'c1', code: 'SAVE20' });
    });

    it('renders the screen heading and submit button', () => {
        render(<CreateCoupon />);
        expect(screen.getByRole('heading', { name: 'Create Coupon' })).toBeInTheDocument();
        expect(screen.getByText('Generate Coupon')).toBeInTheDocument();
    });

    it('calls onBack when the cancel button is clicked', () => {
        const onBack = vi.fn();
        render(<CreateCoupon onBack={onBack} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('validates required fields before submitting', async () => {
        render(<CreateCoupon />);
        fireEvent.click(screen.getByText('Generate Coupon'));
        await waitFor(() => {
            expect(screen.getByText('Coupon code is required.')).toBeInTheDocument();
        });
        expect(createCoupon).not.toHaveBeenCalled();
    });

    it('rejects a percentage discount above 100', async () => {
        render(<CreateCoupon />);
        fireEvent.change(screen.getByPlaceholderText('e.g. SAVE20'), { target: { value: 'SAVE20' } });
        fireEvent.change(screen.getByPlaceholderText('20'), { target: { value: '150' } });
        fireEvent.click(screen.getByText('Generate Coupon'));
        await waitFor(() => {
            expect(screen.getByText('Percentage cannot exceed 100.')).toBeInTheDocument();
        });
        expect(createCoupon).not.toHaveBeenCalled();
    });

    it('submits a valid coupon and shows a success banner', async () => {
        const onCreated = vi.fn();
        render(<CreateCoupon onCreated={onCreated} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. SAVE20'), { target: { value: 'SAVE20' } });
        fireEvent.change(screen.getByPlaceholderText('20'), { target: { value: '20' } });
        fireEvent.click(screen.getByText('Generate Coupon'));
        await waitFor(() => expect(createCoupon).toHaveBeenCalledTimes(1));
        expect(createCoupon).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'SAVE20', discount_type: 'percentage', discount_value: 20 }),
        );
        await waitFor(() =>
            expect(screen.getByText(/created successfully/i)).toBeInTheDocument(),
        );
        expect(onCreated).toHaveBeenCalled();
    });

    it('updates the live preview as the code is typed', () => {
        render(<CreateCoupon />);
        fireEvent.change(screen.getByPlaceholderText('e.g. SAVE20'), { target: { value: 'diwali' } });
        // Code is upper-cased in the preview card.
        expect(screen.getByText('DIWALI')).toBeInTheDocument();
    });

    it('shows an "API not connected" message on a network error', async () => {
        const netErr = new ApiError('Network request failed', 0, null);
        (createCoupon as any).mockRejectedValueOnce(netErr);
        render(<CreateCoupon />);
        fireEvent.change(screen.getByPlaceholderText('e.g. SAVE20'), { target: { value: 'SAVE20' } });
        fireEvent.change(screen.getByPlaceholderText('20'), { target: { value: '20' } });
        fireEvent.click(screen.getByText('Generate Coupon'));
        await waitFor(() =>
            expect(screen.getByText(/marketing api is not connected/i)).toBeInTheDocument(),
        );
    });
});
