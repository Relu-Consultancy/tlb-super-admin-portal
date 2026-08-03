/**
 * Roles & permissions reference (API doc §7).
 *
 * `SUPER_ADMIN` implicitly has every permission. Sub-admin roles get their
 * default permissions plus any granted `extra_permissions`.
 */

export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE_MANAGER',
  'SUPPORT_AGENT',
  'OPERATIONS_MANAGER',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Roles assignable via the API (SUPER_ADMIN is server-only). */
export const ASSIGNABLE_ROLES: AdminRole[] = [
  'ADMIN',
  'FINANCE_MANAGER',
  'SUPPORT_AGENT',
  'OPERATIONS_MANAGER',
];

/** Human-friendly labels for display. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FINANCE_MANAGER: 'Finance Manager',
  SUPPORT_AGENT: 'Support Agent',
  OPERATIONS_MANAGER: 'Operations Manager',
};

export function roleLabel(role: string): string {
  return (ROLE_LABELS as Record<string, string>)[role] ?? role;
}

export const PERMISSIONS = [
  'VIEW_TRANSACTIONS',
  'RECORD_PAYMENTS',
  'EXPORT_REPORTS',
  'VIEW_REVENUE',
  'VIEW_CUSTOMERS',
  'MANAGE_CUSTOMERS',
  'VIEW_PARTNERS',
  'MANAGE_PARTNERS',
  'APPROVE_PARTNERS',
  'VIEW_LISTINGS',
  'MANAGE_LISTINGS',
  'MANAGE_TLB_LISTINGS',
  'VIEW_ENQUIRIES',
  'MANAGE_ENQUIRIES',
  'VIEW_BOOKINGS',
  'MANAGE_BOOKINGS',
  'VIEW_ADMINS',
  'MANAGE_ADMINS',
  'VIEW_AUDIT_LOGS',
  'VIEW_ANALYTICS',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Default permissions granted by each role (API doc §7). SUPER_ADMIN has all. */
export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: [
    'VIEW_CUSTOMERS',
    'MANAGE_CUSTOMERS',
    'VIEW_PARTNERS',
    'MANAGE_PARTNERS',
    'APPROVE_PARTNERS',
    'VIEW_LISTINGS',
    'MANAGE_LISTINGS',
    'MANAGE_TLB_LISTINGS',
    'VIEW_ENQUIRIES',
    'MANAGE_ENQUIRIES',
    'VIEW_BOOKINGS',
    'MANAGE_BOOKINGS',
    'VIEW_ANALYTICS',
  ],
  FINANCE_MANAGER: ['VIEW_TRANSACTIONS', 'RECORD_PAYMENTS', 'EXPORT_REPORTS', 'VIEW_REVENUE', 'VIEW_BOOKINGS'],
  SUPPORT_AGENT: ['VIEW_CUSTOMERS', 'VIEW_ENQUIRIES', 'MANAGE_ENQUIRIES', 'VIEW_BOOKINGS'],
  OPERATIONS_MANAGER: [
    'VIEW_CUSTOMERS',
    'VIEW_PARTNERS',
    'MANAGE_PARTNERS',
    'VIEW_LISTINGS',
    'MANAGE_LISTINGS',
    'MANAGE_TLB_LISTINGS',
    'VIEW_BOOKINGS',
    'MANAGE_BOOKINGS',
    'VIEW_ANALYTICS',
  ],
};

/** Human-readable permission label, e.g. VIEW_TRANSACTIONS -> "View transactions". */
export function permissionLabel(code: string): string {
  const s = code.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
