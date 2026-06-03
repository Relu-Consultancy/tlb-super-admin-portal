import { describe, it, expect } from 'vitest';
import { adminPath, helpPath, mediaUrl, API_BASE_URL, ADMIN_API_PREFIX, HELP_ADMIN_PREFIX } from './config';

describe('adminPath', () => {
    it('prefixes the admin API path and preserves trailing slashes', () => {
        expect(adminPath('auth/login/')).toBe('/api/v1/admin/auth/login/');
        expect(adminPath('profile/')).toBe('/api/v1/admin/profile/');
    });

    it('strips a leading slash to avoid doubling', () => {
        expect(adminPath('/users/')).toBe('/api/v1/admin/users/');
    });

    it('uses the shared prefix constant', () => {
        expect(adminPath('x/')).toBe(`${ADMIN_API_PREFIX}/x/`);
    });
});

describe('helpPath', () => {
    it('prefixes the help-admin path', () => {
        expect(helpPath('tickets/')).toBe('/api/v1/help/admin/tickets/');
        expect(helpPath('/tickets/3/')).toBe(`${HELP_ADMIN_PREFIX}/tickets/3/`);
    });
});

describe('mediaUrl', () => {
    it('returns an empty string for nullish input', () => {
        expect(mediaUrl('')).toBe('');
        expect(mediaUrl(null)).toBe('');
        expect(mediaUrl(undefined)).toBe('');
    });

    it('leaves absolute URLs untouched', () => {
        expect(mediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
        expect(mediaUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png');
    });

    it('prefixes relative paths with the API host', () => {
        expect(mediaUrl('media/partners/x.png')).toBe(`${API_BASE_URL}/media/partners/x.png`);
        expect(mediaUrl('/media/partners/x.png')).toBe(`${API_BASE_URL}/media/partners/x.png`);
    });
});
