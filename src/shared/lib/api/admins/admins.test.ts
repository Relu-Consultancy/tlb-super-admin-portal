import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: {
        get: vi.fn(() => Promise.resolve({ count: 0, results: [] })),
        post: vi.fn(() => Promise.resolve({})),
        patch: vi.fn(() => Promise.resolve({})),
    },
    ApiError: class ApiError extends Error {},
}));
import { api } from '../core/client';
import {
    listAdmins,
    getAdmin,
    disableAdmin,
    enableAdmin,
    createAdmin,
    changeAdminRole,
    updateAdminPermissions,
    forceLogoutAdmin,
    unlockAdmin,
} from './admins';

describe('admins service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('listAdmins passes filters', async () => {
        await listAdmins({ search: 'x', page: 1 });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/', { params: { search: 'x', page: 1 } });
    });

    it('getAdmin builds the detail path', async () => {
        await getAdmin('a-9');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/a-9/');
    });

    it('disableAdmin sends a reason', async () => {
        await disableAdmin('a-9', 'policy');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/a-9/disable/', { reason: 'policy' });
    });

    it('enableAdmin posts to the enable path', async () => {
        await enableAdmin('a-9');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/a-9/enable/');
    });

    it('createAdmin posts the payload', async () => {
        const payload = { email: 'n@tlb.com', full_name: 'N', role: 'ADMIN' as const, password: 'pw' };
        await createAdmin(payload);
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/create/', payload);
    });

    it('changeAdminRole patches the role', async () => {
        await changeAdminRole('a-9', 'FINANCE_MANAGER');
        expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/a-9/role/', { role: 'FINANCE_MANAGER' });
    });

    it('updateAdminPermissions patches the permissions list', async () => {
        await updateAdminPermissions('a-9', ['VIEW_CUSTOMERS']);
        expect(api.patch).toHaveBeenCalledWith('/api/v1/admin/accounts/admins/a-9/permissions/', { permissions: ['VIEW_CUSTOMERS'] });
    });

    it('forceLogoutAdmin and unlockAdmin hit their endpoints', async () => {
        await forceLogoutAdmin('a-9');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/force-logout/a-9/');
        await unlockAdmin('a-9');
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/unlock/a-9/');
    });
});
