import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const { state, apiMocks } = vi.hoisted(() => ({
    state: {
        hasSession: false,
        profile: { full_name: 'Vishesh', role: 'SUPER_ADMIN', effective_permissions: [] as string[] },
    },
    apiMocks: {
        login: vi.fn(() => Promise.resolve()),
        logout: vi.fn(() => Promise.resolve()),
        logoutAll: vi.fn(() => Promise.resolve()),
        getProfile: vi.fn(),
    },
}));

vi.mock('../lib/api', () => ({
    SESSION_EXPIRED_EVENT: 'auth:expired',
    hasSession: () => state.hasSession,
    getProfile: () => apiMocks.getProfile(),
    login: (...a: any[]) => (apiMocks.login as any)(...a),
    logout: () => apiMocks.logout(),
    logoutAll: () => apiMocks.logoutAll(),
}));

function Consumer() {
    const { status, admin, login, logout, hasPermission } = useAuth();
    return (
        <div>
            <span data-testid="status">{status}</span>
            <span data-testid="admin">{admin?.full_name ?? 'none'}</span>
            <span data-testid="manage-admins">{hasPermission('MANAGE_ADMINS') ? 'yes' : 'no'}</span>
            <span data-testid="view-customers">{hasPermission('VIEW_CUSTOMERS') ? 'yes' : 'no'}</span>
            <button onClick={() => login('e@x.com', 'pw')}>login</button>
            <button onClick={() => logout()}>logout</button>
        </div>
    );
}

const renderAuth = () => render(<AuthProvider><Consumer /></AuthProvider>);

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.hasSession = false;
        state.profile = { full_name: 'Vishesh', role: 'SUPER_ADMIN', effective_permissions: [] };
        apiMocks.getProfile.mockImplementation(() => Promise.resolve(state.profile));
    });

    it('is unauthenticated with no session', async () => {
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
        expect(apiMocks.getProfile).not.toHaveBeenCalled();
    });

    it('loads the profile when a session exists', async () => {
        state.hasSession = true;
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
        expect(screen.getByTestId('admin')).toHaveTextContent('Vishesh');
    });

    it('SUPER_ADMIN passes every permission check', async () => {
        state.hasSession = true;
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
        expect(screen.getByTestId('manage-admins')).toHaveTextContent('yes');
    });

    it('a sub-admin only passes its effective permissions', async () => {
        state.hasSession = true;
        state.profile = { full_name: 'Sub', role: 'ADMIN', effective_permissions: ['VIEW_CUSTOMERS'] } as any;
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
        expect(screen.getByTestId('view-customers')).toHaveTextContent('yes');
        expect(screen.getByTestId('manage-admins')).toHaveTextContent('no');
    });

    it('login authenticates and loads the profile', async () => {
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
        await userEvent.click(screen.getByText('login'));
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
        expect(apiMocks.login).toHaveBeenCalledWith('e@x.com', 'pw');
    });

    it('logout returns to unauthenticated', async () => {
        state.hasSession = true;
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
        await userEvent.click(screen.getByText('logout'));
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
        expect(apiMocks.logout).toHaveBeenCalled();
    });

    it('drops the session when auth:expired fires', async () => {
        state.hasSession = true;
        renderAuth();
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
        act(() => {
            window.dispatchEvent(new CustomEvent('auth:expired', { detail: { code: 'TOKEN_REVOKED' } }));
        });
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    });

    it('useAuth throws outside a provider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Consumer />)).toThrow(/useAuth must be used within an AuthProvider/);
        spy.mockRestore();
    });
});
