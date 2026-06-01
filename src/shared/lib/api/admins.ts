/**
 * Admin accounts & admin-management service.
 *
 * Covers the admin list (API doc §5) plus the Super-Admin-only actions from §4
 * (`force-logout`, `unlock`). Disable/enable and RBAC (§5/§6) are added here as
 * those screens are built.
 */

import { api } from './client';
import { adminPath } from './config';
import type { AdminRole } from './roles';
import type { Paginated } from './types';

/** Row shape from GET /accounts/admins/ (API doc §5). */
export interface AdminListItem {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  is_locked: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ListAdminsParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
}

/** GET /accounts/admins/ — paginated list of admins. */
export function listAdmins(params?: ListAdminsParams): Promise<Paginated<AdminListItem>> {
  return api.get<Paginated<AdminListItem>>(adminPath('accounts/admins/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** Full admin shape from GET /accounts/admins/{id}/ (API doc §5). */
export interface AdminDetail {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  department: string;
  role: AdminRole;
  is_active: boolean;
  is_locked: boolean;
  locked_reason: string;
  extra_permissions: string[];
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
}

export interface CreateAdminPayload {
  email: string;
  full_name: string;
  role: AdminRole;
  password: string;
  phone?: string;
  department?: string;
}

/** GET /accounts/admins/{id}/ — single admin detail. */
export function getAdmin(adminId: string): Promise<AdminDetail> {
  return api.get<AdminDetail>(adminPath(`accounts/admins/${adminId}/`));
}

/** POST /accounts/admins/{id}/disable/ — revoke sessions + disable (needs reason). */
export function disableAdmin(adminId: string, reason: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`accounts/admins/${adminId}/disable/`), { reason });
}

/** POST /accounts/admins/{id}/enable/ — re-enable a disabled admin. */
export function enableAdmin(adminId: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`accounts/admins/${adminId}/enable/`));
}

/** POST /accounts/admins/create/ — create a sub-admin (§6). */
export function createAdmin(payload: CreateAdminPayload): Promise<AdminDetail> {
  return api.post<AdminDetail>(adminPath('accounts/admins/create/'), payload);
}

/** PATCH /accounts/admins/{id}/role/ — change a sub-admin's role (force-logs them out). */
export function changeAdminRole(adminId: string, role: AdminRole): Promise<AdminDetail> {
  return api.patch<AdminDetail>(adminPath(`accounts/admins/${adminId}/role/`), { role });
}

/** PATCH /accounts/admins/{id}/permissions/ — replace the full extra-permissions list. */
export function updateAdminPermissions(adminId: string, permissions: string[]): Promise<AdminDetail> {
  return api.patch<AdminDetail>(adminPath(`accounts/admins/${adminId}/permissions/`), { permissions });
}

/** POST /force-logout/{admin_id}/ — revoke all sessions of the target admin. */
export function forceLogoutAdmin(adminId: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`force-logout/${adminId}/`));
}

/** POST /unlock/{admin_id}/ — clear a lock from 5 failed login attempts. */
export function unlockAdmin(adminId: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`unlock/${adminId}/`));
}
