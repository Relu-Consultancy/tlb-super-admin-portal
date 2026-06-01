/**
 * Audit logs service — GET /audit-logs/ (API doc §4).
 */

import { api } from './client';
import { adminPath } from './config';
import type { Paginated } from './types';

/** All audit action codes (API doc §4). */
export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'LOGOUT_ALL',
  'FORCE_LOGOUT',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'ADMIN_CREATED',
  'TOKEN_REFRESH',
  'USER_DISABLED',
  'USER_ENABLED',
  'PARTNER_DISABLED',
  'PARTNER_ENABLED',
  'ADMIN_DISABLED',
  'ADMIN_ENABLED',
  'ROLE_CHANGED',
  'PERMISSIONS_UPDATED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  ip_address: string;
  device_info: string;
  target_admin_email: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogParams {
  admin_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

/** GET /audit-logs/ — paginated, filterable audit trail. */
export function getAuditLogs(params?: AuditLogParams): Promise<Paginated<AuditLog>> {
  return api.get<Paginated<AuditLog>>(adminPath('audit-logs/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** Human-readable label for an action code, e.g. USER_DISABLED -> "User disabled". */
export function auditActionLabel(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Tailwind badge classes for an action, grouped by severity/category. */
export function auditActionTone(action: string): string {
  if (/(FORCE_LOGOUT|ACCOUNT_LOCKED|DISABLED)$/.test(action) || action === 'FORCE_LOGOUT')
    return 'bg-red-50 text-red-600';
  if (/(UNLOCKED|ENABLED)$/.test(action) || action === 'ACCOUNT_UNLOCKED')
    return 'bg-green-50 text-green-600';
  if (action.startsWith('PASSWORD') || action === 'ROLE_CHANGED' || action === 'PERMISSIONS_UPDATED')
    return 'bg-yellow-50 text-yellow-700';
  if (action === 'ADMIN_CREATED') return 'bg-purple-50 text-purple-600';
  if (action === 'LOGIN' || action === 'LOGOUT' || action === 'LOGOUT_ALL' || action === 'TOKEN_REFRESH')
    return 'bg-blue-50 text-blue-600';
  return 'bg-gray-100 text-gray-600';
}
