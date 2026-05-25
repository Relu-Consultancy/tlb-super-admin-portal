import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginScreen from './LoginScreen';

describe('LoginScreen', () => {
    it('renders the TLB Admin Team heading', () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        expect(screen.getByText('TLB Admin Team')).toBeInTheDocument();
    });

    it('renders email and password input fields', () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        expect(screen.getByPlaceholderText('name@tlb-events.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('renders the Login button', () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders the Forgot Password link', () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
    });

    it('password field is of type password by default', () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility when show/hide button is clicked', async () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const toggleBtn = screen.getByRole('button', { name: /show password/i });

        expect(passwordInput).toHaveAttribute('type', 'password');
        await userEvent.click(toggleBtn);
        expect(passwordInput).toHaveAttribute('type', 'text');
        await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('calls onLogin when the form is submitted', async () => {
        const onLogin = vi.fn();
        render(<LoginScreen onLogin={onLogin} />);
        const loginBtn = screen.getByRole('button', { name: /login/i });
        await userEvent.click(loginBtn);
        expect(onLogin).toHaveBeenCalledTimes(1);
    });

    it('renders the copyright footer', () => {
        render(<LoginScreen onLogin={vi.fn()} />);
        expect(screen.getByText(/TLB Event Management Platform/i)).toBeInTheDocument();
    });
});
