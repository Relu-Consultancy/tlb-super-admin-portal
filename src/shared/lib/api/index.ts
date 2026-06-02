/**
 * Barrel export for the API layer.
 *
 *   import { api, ApiError, login, getProfile } from '@/shared/lib/api';
 */

// Core client
export { api, ApiError, SESSION_EXPIRED_EVENT } from './client';
export type { RequestOptions, SessionExpiredDetail } from './client';
export { API_BASE_URL, API_TIMEOUT, ADMIN_API_PREFIX, adminPath, HELP_ADMIN_PREFIX, helpPath } from './config';

// Token storage
export {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  hasSession,
} from './token';
export type { TokenPair } from './token';

// Roles & permissions
export {
  ADMIN_ROLES,
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  roleLabel,
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  permissionLabel,
} from './roles';
export type { AdminRole, Permission } from './roles';

// Auth service
export {
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
} from './auth';
export type { AdminUser, LoginResponse, RefreshResponse } from './auth';

// Profile & sessions
export { getProfile, getSessions } from './profile';
export type { AdminProfile, AdminSession } from './profile';

// Shared types
export type { Paginated } from './types';

// Admin management (§4 actions + §5 list/detail/disable/enable + §6 RBAC)
export {
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
export type { AdminListItem, ListAdminsParams, AdminDetail, CreateAdminPayload } from './admins';

// Customer accounts (§5)
export { listCustomers, getCustomer, disableCustomer, enableCustomer } from './customers';
export type { Customer, ListCustomersParams } from './customers';

// Partner accounts (§5)
export {
  listPartners,
  getPartner,
  disablePartner,
  enablePartner,
  partnerStatusLabel,
  partnerStatusTone,
} from './partners';
export type { Partner, ListPartnersParams } from './partners';

// Audit logs (§4)
export {
  getAuditLogs,
  auditActionLabel,
  auditActionTone,
  AUDIT_ACTIONS,
} from './auditLogs';
export type { AuditLog, AuditAction, AuditLogParams } from './auditLogs';

// Support tickets (Help / Admin)
export {
  listTickets,
  getTicket,
  getTicketMessages,
  sendTicketMessage,
  updateTicketStatus,
  ticketStatusLabel,
  ticketStatusTone,
  ticketCategoryLabel,
  TICKET_STATUSES,
} from './support';
export type { SupportTicket, TicketMessage, TicketStatus, ListTicketsParams } from './support';
