import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { post: vi.fn(() => Promise.resolve({})), get: vi.fn() },
    ApiError: class ApiError extends Error {},
}));
import { api } from '../core/client';
import { login, logout, logoutAll, changePassword, forgotPassword, resetPassword } from './auth';
import { getAccessToken, getRefreshToken, setTokens } from '../core/token';

describe('auth service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        (api.post as any).mockResolvedValue({});
    });

    it('login posts credentials (skipAuth) and stores the token pair', async () => {
        (api.post as any).mockResolvedValue({ access_token: 'A', refresh_token: 'R', token_type: 'Bearer', admin: {} });
        await login('admin@tlb.com', 'pw');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/auth/login/', { email: 'admin@tlb.com', password: 'pw' }, { skipAuth: true });
        expect(getAccessToken()).toBe('A');
        expect(getRefreshToken()).toBe('R');
    });

    it('logout revokes the session then clears local tokens', async () => {
        setTokens({ access: 'A', refresh: 'R' });
        await logout();
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/auth/logout/', { refresh_token: 'R' });
        expect(getRefreshToken()).toBeNull();
    });

    it('logout clears tokens even if the server call fails', async () => {
        setTokens({ access: 'A', refresh: 'R' });
        (api.post as any).mockRejectedValue(new Error('network'));
        await logout();
        expect(getRefreshToken()).toBeNull();
    });

    it('logoutAll clears tokens', async () => {
        setTokens({ access: 'A', refresh: 'R' });
        await logoutAll();
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/auth/logout-all/');
        expect(getAccessToken()).toBeNull();
    });

    it('changePassword sends the undocumented confirm_new_password field', async () => {
        (api.post as any).mockResolvedValue({ detail: 'ok' });
        await changePassword('old', 'New1!pass', 'New1!pass');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/auth/change-password/', {
            old_password: 'old',
            new_password: 'New1!pass',
            confirm_new_password: 'New1!pass',
        });
    });

    it('forgotPassword posts the email without auth', async () => {
        (api.post as any).mockResolvedValue({ detail: 'sent' });
        await forgotPassword('a@b.com');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/auth/forgot-password/', { email: 'a@b.com' }, { skipAuth: true });
    });

    it('resetPassword posts token + confirm field without auth', async () => {
        (api.post as any).mockResolvedValue({ detail: 'done' });
        await resetPassword('tok', 'New1!pass', 'New1!pass');
        expect(api.post).toHaveBeenCalledWith(
            '/api/v1/admin/auth/reset-password/',
            { token: 'tok', new_password: 'New1!pass', confirm_new_password: 'New1!pass' },
            { skipAuth: true },
        );
    });
});
