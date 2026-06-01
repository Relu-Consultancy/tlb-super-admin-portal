import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordScreen from './ForgotPasswordScreen';

const { mockForgot } = vi.hoisted(() => ({ mockForgot: vi.fn(() => Promise.resolve({ detail: 'ok' })) }));
vi.mock('../../shared/lib/api', () => ({
    forgotPassword: mockForgot,
    ApiError: class ApiError extends Error { isNetworkError = false; },
}));

describe('ForgotPasswordScreen', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the heading and email field', () => {
        render(<ForgotPasswordScreen onBack={vi.fn()} />);
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@tlb-events.com')).toBeInTheDocument();
    });

    it('validates the email before submitting', async () => {
        render(<ForgotPasswordScreen onBack={vi.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(mockForgot).not.toHaveBeenCalled();
    });

    it('submits and shows the confirmation state', async () => {
        render(<ForgotPasswordScreen onBack={vi.fn()} />);
        await userEvent.type(screen.getByPlaceholderText('name@tlb-events.com'), 'admin@tlb-events.com');
        await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        await waitFor(() => expect(mockForgot).toHaveBeenCalledWith('admin@tlb-events.com'));
        expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    });

    it('calls onBack from the back link', async () => {
        const onBack = vi.fn();
        render(<ForgotPasswordScreen onBack={onBack} />);
        await userEvent.click(screen.getByRole('button', { name: /back to login/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
