import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, SESSION_EXPIRED_EVENT } from './client';
import { setTokens, getAccessToken, getRefreshToken } from './token';

/** Build a minimal fetch Response stand-in. */
function makeRes(status: number, body: unknown, contentType = 'application/json') {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    } as unknown as Response;
}

describe('api client', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.restoreAllMocks();
    });
    afterEach(() => vi.restoreAllMocks());

    it('unwraps the success envelope and returns inner data', async () => {
        global.fetch = vi.fn(() => Promise.resolve(makeRes(200, { success: true, data: { id: 7 } }))) as any;
        await expect(api.get<{ id: number }>('/api/v1/admin/profile/')).resolves.toEqual({ id: 7 });
    });

    it('throws a typed ApiError carrying the backend code on a failure envelope', async () => {
        global.fetch = vi.fn(() => Promise.resolve(makeRes(400, { success: false, data: null, error: { code: 'BAD_INPUT', message: 'Nope' } }))) as any;
        await expect(api.get('/api/v1/admin/x/')).rejects.toMatchObject({ code: 'BAD_INPUT', status: 400, message: 'Nope' });
    });

    it('appends query params and skips nullish values', async () => {
        const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(makeRes(200, { success: true, data: [] })));
        global.fetch = fetchMock as any;
        await api.get('/api/v1/admin/users/', { params: { search: 'ann', is_active: true, page: null, extra: undefined } });
        const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
        expect(calledUrl.searchParams.get('search')).toBe('ann');
        expect(calledUrl.searchParams.get('is_active')).toBe('true');
        expect(calledUrl.searchParams.has('page')).toBe(false);
        expect(calledUrl.searchParams.has('extra')).toBe(false);
    });

    it('attaches a Bearer token, but not when skipAuth is set', async () => {
        setTokens({ access: 'tok-123', refresh: 'r' });
        const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(makeRes(200, { success: true, data: {} })));
        global.fetch = fetchMock as any;

        await api.get('/api/v1/admin/profile/');
        let headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
        expect(headers.get('Authorization')).toBe('Bearer tok-123');

        await api.post('/api/v1/admin/auth/login/', { email: 'x' }, { skipAuth: true });
        headers = (fetchMock.mock.calls[1][1] as RequestInit).headers as Headers;
        expect(headers.get('Authorization')).toBeNull();
    });

    it('serializes a JSON body and sets the content-type', async () => {
        const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(makeRes(200, { success: true, data: {} })));
        global.fetch = fetchMock as any;
        await api.post('/api/v1/admin/x/', { a: 1 });
        const init = fetchMock.mock.calls[0][1] as RequestInit;
        expect(init.body).toBe(JSON.stringify({ a: 1 }));
        expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
    });

    it('returns null for a 204 No Content response', async () => {
        global.fetch = vi.fn(() => Promise.resolve(makeRes(204, null))) as any;
        await expect(api.delete('/api/v1/admin/x/')).resolves.toBeNull();
    });

    it('wraps connectivity failures as a network ApiError', async () => {
        global.fetch = vi.fn(() => Promise.reject(new TypeError('boom'))) as any;
        try {
            await api.get('/api/v1/admin/x/');
            throw new Error('should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).status).toBe(0);
            expect((err as ApiError).isNetworkError).toBe(true);
        }
    });

    it('transparently refreshes the token once on 401 and retries', async () => {
        setTokens({ access: 'old', refresh: 'refresh-old' });
        let mainCalls = 0;
        global.fetch = vi.fn((url: any) => {
            if (String(url).includes('auth/refresh')) {
                return Promise.resolve(makeRes(200, { success: true, data: { access_token: 'new-access', refresh_token: 'new-refresh' } }));
            }
            mainCalls++;
            if (mainCalls === 1) return Promise.resolve(makeRes(401, { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } }));
            return Promise.resolve(makeRes(200, { success: true, data: { ok: true } }));
        }) as any;

        await expect(api.get('/api/v1/admin/profile/')).resolves.toEqual({ ok: true });
        expect(getAccessToken()).toBe('new-access');
        expect(getRefreshToken()).toBe('new-refresh');
    });

    it('emits auth:expired and clears tokens when refresh fails', async () => {
        setTokens({ access: 'old', refresh: 'refresh-old' });
        const onExpired = vi.fn();
        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
        global.fetch = vi.fn((url: any) => {
            if (String(url).includes('auth/refresh')) return Promise.resolve(makeRes(401, { success: false, error: { code: 'TOKEN_REVOKED', message: 'no' } }));
            return Promise.resolve(makeRes(401, { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } }));
        }) as any;

        await expect(api.get('/api/v1/admin/profile/')).rejects.toBeInstanceOf(ApiError);
        expect(onExpired).toHaveBeenCalled();
        expect(getAccessToken()).toBeNull();
        window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    });
});
