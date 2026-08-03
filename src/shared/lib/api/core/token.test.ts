import { describe, it, expect, beforeEach } from 'vitest';
import {
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearTokens,
    hasSession,
} from './token';

describe('token storage', () => {
    beforeEach(() => sessionStorage.clear());

    it('returns null when nothing is stored', () => {
        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(hasSession()).toBe(false);
    });

    it('persists and reads back a token pair', () => {
        setTokens({ access: 'access-1', refresh: 'refresh-1' });
        expect(getAccessToken()).toBe('access-1');
        expect(getRefreshToken()).toBe('refresh-1');
        expect(hasSession()).toBe(true);
    });

    it('clears both tokens', () => {
        setTokens({ access: 'a', refresh: 'r' });
        clearTokens();
        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(hasSession()).toBe(false);
    });

    it('treats a refresh token alone as a session', () => {
        sessionStorage.setItem('tlb_admin_refresh_token', 'r');
        expect(hasSession()).toBe(true);
    });
});
