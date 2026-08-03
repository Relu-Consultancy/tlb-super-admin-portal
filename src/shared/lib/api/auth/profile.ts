/**
 * Profile & sessions service — `/api/v1/admin/profile/` and `/sessions/`.
 */

import { api } from '../core/client';
import { adminPath } from '../core/config';
import type { AdminRole } from '../core/roles';

/** Full admin profile, including computed `effective_permissions` for UI gating. */
export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  department: string;
  avatar: string | null;
  role: AdminRole;
  is_active: boolean;
  is_locked: boolean;
  extra_permissions: string[];
  effective_permissions: string[];
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  ip_address: string;
  device_info: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

/** GET /profile/ — the currently authenticated admin. */
export function getProfile(): Promise<AdminProfile> {
  return api.get<AdminProfile>(adminPath('profile/'));
}

/** GET /sessions/ — active sessions for the current admin. */
export function getSessions(): Promise<AdminSession[]> {
  return api.get<AdminSession[]>(adminPath('sessions/'));
}
