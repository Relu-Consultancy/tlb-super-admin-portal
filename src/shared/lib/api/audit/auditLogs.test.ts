import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/client', () => ({
    api: { get: vi.fn(() => Promise.resolve({ count: 0, results: [] })) },
    ApiError: class ApiError extends Error {},
}));
import { api } from '../core/client';
import { getAuditLogs, auditActionLabel, auditActionTone, AUDIT_ACTIONS } from './auditLogs';

describe('auditActionLabel', () => {
    it('humanizes action codes', () => {
        expect(auditActionLabel('USER_DISABLED')).toBe('User disabled');
        expect(auditActionLabel('LOGIN')).toBe('Login');
        expect(auditActionLabel('PERMISSIONS_UPDATED')).toBe('Permissions updated');
    });
});

describe('auditActionTone', () => {
    it('uses red for destructive actions', () => {
        expect(auditActionTone('USER_DISABLED')).toContain('red');
        expect(auditActionTone('FORCE_LOGOUT')).toContain('red');
        expect(auditActionTone('ACCOUNT_LOCKED')).toContain('red');
    });
    it('uses green for enabling/unlocking', () => {
        expect(auditActionTone('USER_ENABLED')).toContain('green');
        expect(auditActionTone('ACCOUNT_UNLOCKED')).toContain('green');
    });
    it('uses distinct tones for auth and admin-create events', () => {
        expect(auditActionTone('LOGIN')).toContain('blue');
        expect(auditActionTone('ADMIN_CREATED')).toContain('purple');
        expect(auditActionTone('PASSWORD_CHANGE')).toContain('yellow');
    });
    it('every known action resolves to a tone class', () => {
        for (const a of AUDIT_ACTIONS) {
            expect(auditActionTone(a)).toMatch(/bg-/);
        }
    });
});

describe('getAuditLogs', () => {
    beforeEach(() => vi.clearAllMocks());
    it('calls the audit-logs endpoint with params', async () => {
        await getAuditLogs({ action: 'LOGIN', page: 2 });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/audit-logs/', {
            params: { action: 'LOGIN', page: 2 },
        });
    });
});
