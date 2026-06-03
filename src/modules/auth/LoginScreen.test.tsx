import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginScreen from './LoginScreen';

// Mock the auth context so the screen can be tested in isolation.
const { mockLogin, authState } = vi.hoisted(() => ({
    mockLogin: vi.fn(() => Promise.resolve()),
    authState: { sessionMessage: null as string | null },
}));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ login: mockLogin, sessionMessage: authState.sessionMessage }),
}));

describe('LoginScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.sessionMessage = null;
    });

    it('renders the TLB Admin Team heading', () => {
        render(<LoginScreen />);
        expect(screen.getByText('TLB Admin Team')).toBeInTheDocument();
    });

    it('renders email and password input fields', () => {
        render(<LoginScreen />);
        expect(screen.getByPlaceholderText('name@tlb-events.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('toggles password visibility when show/hide button is clicked', async () => {
        render(<LoginScreen />);
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        await userEvent.click(screen.getByRole('button', { name: /show password/i }));
        expect(passwordInput).toHaveAttribute('type', 'text');
        await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('shows validation errors and does NOT call login when fields are empty', async () => {
        render(<LoginScreen />);
        await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows an error for an invalid email format', async () => {
        render(<LoginScreen />);
        await userEvent.type(screen.getByPlaceholderText('name@tlb-events.com'), 'not-an-email');
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
        await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
        expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('calls login with valid credentials', async () => {
        render(<LoginScreen />);
        await userEvent.type(screen.getByPlaceholderText('name@tlb-events.com'), 'admin@tlb-events.com');
        await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
        await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
        await waitFor(() =>
            expect(mockLogin).toHaveBeenCalledWith('admin@tlb-events.com', 'secret123'),
        );
    });

    it('displays the session message when present', () => {
        authState.sessionMessage = 'Your session has expired. Please log in again.';
        render(<LoginScreen />);
        expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });

    it('calls onForgotPassword when the link is clicked', async () => {
        const onForgotPassword = vi.fn();
        render(<LoginScreen onForgotPassword={onForgotPassword} />);
        await userEvent.click(screen.getByRole('button', { name: /forgot password/i }));
        expect(onForgotPassword).toHaveBeenCalledTimes(1);
    });

    it('renders a Back button only when onBack is provided', async () => {
        const onBack = vi.fn();
        const { rerender } = render(<LoginScreen />);
        expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
        rerender(<LoginScreen onBack={onBack} />);
        await userEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders the copyright footer', () => {
        render(<LoginScreen />);
        expect(screen.getByText(/TLB Event Management Platform/i)).toBeInTheDocument();
    });
});
