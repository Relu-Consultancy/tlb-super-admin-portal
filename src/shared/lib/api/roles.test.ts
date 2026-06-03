import { describe, it, expect } from 'vitest';
import {
    ADMIN_ROLES,
    ASSIGNABLE_ROLES,
    roleLabel,
    permissionLabel,
    PERMISSIONS,
    ROLE_DEFAULT_PERMISSIONS,
} from './roles';

describe('roleLabel', () => {
    it('maps known roles to friendly labels', () => {
        expect(roleLabel('SUPER_ADMIN')).toBe('Super Admin');
        expect(roleLabel('FINANCE_MANAGER')).toBe('Finance Manager');
        expect(roleLabel('SUPPORT_AGENT')).toBe('Support Agent');
    });

    it('falls back to the raw code for unknown roles', () => {
        expect(roleLabel('MYSTERY')).toBe('MYSTERY');
    });
});

describe('permissionLabel', () => {
    it('humanizes a permission code', () => {
        expect(permissionLabel('VIEW_TRANSACTIONS')).toBe('View transactions');
        expect(permissionLabel('MANAGE_CUSTOMERS')).toBe('Manage customers');
    });
});

describe('roles & permissions matrix', () => {
    it('excludes SUPER_ADMIN from assignable roles', () => {
        expect(ASSIGNABLE_ROLES).not.toContain('SUPER_ADMIN');
        expect(ADMIN_ROLES).toContain('SUPER_ADMIN');
    });

    it('grants SUPER_ADMIN every permission', () => {
        expect(ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN).toEqual([...PERMISSIONS]);
    });

    it('gives SUPPORT_AGENT enquiry permissions but not admin management', () => {
        expect(ROLE_DEFAULT_PERMISSIONS.SUPPORT_AGENT).toContain('MANAGE_ENQUIRIES');
        expect(ROLE_DEFAULT_PERMISSIONS.SUPPORT_AGENT).not.toContain('MANAGE_ADMINS');
    });
});
