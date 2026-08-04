import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminManagement from './AdminManagement';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                if (!cache[tag]) {
                    cache[tag] = ({ children, ...props }: any) => {
                        const { initial, animate, exit, transition, layoutId, ...rest } = props;
                        return React.createElement(tag as any, rest, children);
                    };
                }
                return cache[tag];
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

const { authState } = vi.hoisted(() => ({ authState: { adminId: 'self-1', canManage: true, canView: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({
        admin: { id: authState.adminId },
        hasPermission: (p: string) => (p === 'MANAGE_ADMINS' ? authState.canManage : authState.canView),
    }),
}));

vi.mock('../../shared/lib/api', () => ({
    listAdmins: vi.fn(),
    getAdmin: vi.fn((id: string) => Promise.resolve({ id, email: 'bob@tlb.com', full_name: 'Bob Jones', phone: '', department: '', role: 'SUPPORT_AGENT', is_active: true, is_locked: true, locked_reason: '', extra_permissions: [], last_login_at: null, last_login_ip: null, created_at: '' })),
    disableAdmin: vi.fn(() => Promise.resolve({ detail: 'disabled' })),
    enableAdmin: vi.fn(() => Promise.resolve({ detail: 'enabled' })),
    createAdmin: vi.fn(() => Promise.resolve({ id: 'new', full_name: 'New Admin', role: 'SUPPORT_AGENT' })),
    changeAdminRole: vi.fn(),
    updateAdminPermissions: vi.fn(),
    forceLogoutAdmin: vi.fn(() => Promise.resolve({ detail: 'Admin has been force-logged out.' })),
    unlockAdmin: vi.fn(() => Promise.resolve({ detail: 'Admin account has been unlocked.' })),
    getAuditLogs: vi.fn(),
    auditActionLabel: (a: string) => a,
    auditActionTone: () => 'bg-gray-100 text-gray-600',
    roleLabel: (r: string) => r,
    permissionLabel: (p: string) => p,
    AUDIT_ACTIONS: ['LOGIN', 'LOGOUT', 'FORCE_LOGOUT'],
    ASSIGNABLE_ROLES: ['ADMIN', 'FINANCE_MANAGER', 'SUPPORT_AGENT', 'OPERATIONS_MANAGER'],
    ADMIN_ROLES: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'SUPPORT_AGENT', 'OPERATIONS_MANAGER'],
    PERMISSIONS: ['VIEW_TRANSACTIONS', 'EXPORT_REPORTS'],
    ROLE_DEFAULT_PERMISSIONS: { SUPER_ADMIN: [], ADMIN: [], FINANCE_MANAGER: [], SUPPORT_AGENT: [], OPERATIONS_MANAGER: [] },
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listAdmins, getAuditLogs, forceLogoutAdmin, createAdmin } from '../../shared/lib/api';

const ADMINS = [
    { id: 'self-1', email: 'me@tlb.com', full_name: 'Alice Admin', role: 'SUPER_ADMIN', is_active: true, is_locked: false, last_login_at: null, created_at: '' },
    { id: 'other-2', email: 'bob@tlb.com', full_name: 'Bob Jones', role: 'SUPPORT_AGENT', is_active: true, is_locked: true, last_login_at: null, created_at: '' },
];
const AUDITS = [
    { id: 'log-1', admin_email: 'me@tlb.com', action: 'LOGIN', ip_address: '1.2.3.4', device_info: 'Chrome', target_admin_email: '', metadata: {}, created_at: '2026-06-01T10:00:00Z' },
];

describe('AdminManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.adminId = 'self-1';
        authState.canManage = true;
        authState.canView = true;
        (listAdmins as any).mockResolvedValue({ count: 2, next: null, previous: null, results: ADMINS });
        (getAuditLogs as any).mockResolvedValue({ count: 1, next: null, previous: null, results: AUDITS });
    });

    it('renders heading and tabs', () => {
        render(<AdminManagement />);
        expect(screen.getByText('Admin Management')).toBeInTheDocument();
        expect(screen.getByText('Activity Log')).toBeInTheDocument();
    });

    it('lists admins fetched from the API', async () => {
        render(<AdminManagement />);
        expect(await screen.findByText('Alice Admin')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shows Unlock for a locked admin and Force Logout for other admins (not self)', async () => {
        render(<AdminManagement />);
        await screen.findByText('Bob Jones');
        expect(screen.getByTitle('Unlock')).toBeInTheDocument();
        expect(screen.getAllByTitle('Force Logout')).toHaveLength(1);
    });

    it('force-logout requires confirmation before calling the API', async () => {
        render(<AdminManagement />);
        await screen.findByText('Bob Jones');
        await userEvent.click(screen.getByTitle('Force Logout'));
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(forceLogoutAdmin).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('Logout'));
        await waitFor(() => expect(forceLogoutAdmin).toHaveBeenCalledWith('other-2'));
    });

    it('shows audit log entries in the Activity Log tab', async () => {
        render(<AdminManagement />);
        await userEvent.click(screen.getByText('Activity Log'));
        await waitFor(() => expect(getAuditLogs).toHaveBeenCalled());
        expect(screen.getAllByText('LOGIN').length).toBeGreaterThan(0);
    });

    it('hides admin actions when the user lacks MANAGE_ADMINS', async () => {
        authState.canManage = false;
        render(<AdminManagement />);
        await screen.findByText('Bob Jones');
        expect(screen.queryByTitle('Force Logout')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Unlock')).not.toBeInTheDocument();
        expect(screen.queryByText('Add New Admin')).not.toBeInTheDocument();
    });

    it('creates a sub-admin from the Add New Admin modal', async () => {
        render(<AdminManagement />);
        await screen.findByText('Bob Jones');
        await userEvent.click(screen.getByText('Add New Admin'));
        await userEvent.type(screen.getByPlaceholderText('email@company.com'), 'alice@tlb.com');
        await userEvent.type(screen.getByPlaceholderText('Alice Kumar'), 'Alice Kumar');
        await userEvent.type(screen.getByPlaceholderText(/Min 8 chars/i), 'SecurePass@123');
        await userEvent.click(screen.getByRole('button', { name: 'Create Admin' }));
        await waitFor(() => expect(createAdmin).toHaveBeenCalledWith(expect.objectContaining({
            email: 'alice@tlb.com',
            full_name: 'Alice Kumar',
            role: 'SUPPORT_AGENT',
            password: 'SecurePass@123',
        })));
    });

    it('shows the roles reference in the Roles & Permissions tab', async () => {
        render(<AdminManagement />);
        await userEvent.click(screen.getByText('Roles & Permissions'));
        expect(await screen.findByText('Roles & Default Permissions')).toBeInTheDocument();
        expect(screen.getByText(/created only by server command/i)).toBeInTheDocument();
    });
});
