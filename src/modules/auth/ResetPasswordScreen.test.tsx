import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordScreen from './ResetPasswordScreen';

vi.mock('motion/react', () => ({
    motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
}));

vi.mock('../../shared/lib/api', () => ({
    resetPassword: vi.fn(() => Promise.resolve({ detail: 'ok' })),
    ApiError: class ApiError extends Error {
        code: string | null = null;
        isNetworkError = false;
        constructor(message: string, code: string | null = null) { super(message); this.code = code; }
    },
}));
import { resetPassword, ApiError } from '../../shared/lib/api';

const STRONG = 'Str0ng!pass';

describe('ResetPasswordScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (resetPassword as any).mockResolvedValue({ detail: 'ok' });
    });

    it('rejects a weak password before calling the API', async () => {
        render(<ResetPasswordScreen token="tok" onDone={vi.fn()} />);
        await userEvent.type(screen.getByLabelText('New Password'), 'weak');
        await userEvent.type(screen.getByLabelText('Confirm Password'), 'weak');
        await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
        expect(await screen.findByText(/Password must contain/i)).toBeInTheDocument();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it('flags mismatched passwords', async () => {
        render(<ResetPasswordScreen token="tok" onDone={vi.fn()} />);
        await userEvent.type(screen.getByLabelText('New Password'), STRONG);
        await userEvent.type(screen.getByLabelText('Confirm Password'), `${STRONG}x`);
        await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
        expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it('submits a valid reset and shows the success view', async () => {
        render(<ResetPasswordScreen token="tok-123" onDone={vi.fn()} />);
        await userEvent.type(screen.getByLabelText('New Password'), STRONG);
        await userEvent.type(screen.getByLabelText('Confirm Password'), STRONG);
        await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
        await waitFor(() => expect(resetPassword).toHaveBeenCalledWith('tok-123', STRONG, STRONG));
        expect(await screen.findByText('Password updated')).toBeInTheDocument();
    });

    it('maps an invalid-token error to a friendly message', async () => {
        (resetPassword as any).mockRejectedValue(new (ApiError as any)('bad', 'INVALID_RESET_TOKEN'));
        render(<ResetPasswordScreen token="tok" onDone={vi.fn()} />);
        await userEvent.type(screen.getByLabelText('New Password'), STRONG);
        await userEvent.type(screen.getByLabelText('Confirm Password'), STRONG);
        await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
        expect(await screen.findByText(/reset link is invalid or has expired/i)).toBeInTheDocument();
    });

    it('calls onDone from the success view', async () => {
        const onDone = vi.fn();
        render(<ResetPasswordScreen token="tok" onDone={onDone} />);
        await userEvent.type(screen.getByLabelText('New Password'), STRONG);
        await userEvent.type(screen.getByLabelText('Confirm Password'), STRONG);
        await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Go to login' }));
        expect(onDone).toHaveBeenCalled();
    });
});
