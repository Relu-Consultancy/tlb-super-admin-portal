/**
 * Barrel export for the API layer.
 *
 *   import { api, ApiError, login, getProfile } from '@/shared/lib/api';
 */

// Core client
export { api, ApiError, SESSION_EXPIRED_EVENT } from './client';
export type { RequestOptions, SessionExpiredDetail } from './client';
export { API_BASE_URL, API_TIMEOUT, ADMIN_API_PREFIX, adminPath, HELP_ADMIN_PREFIX, helpPath, mediaUrl } from './config';

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

// Admin user (customer) management
export {
  listUsers,
  getUser,
  getUserMetrics,
  getUserActivity,
  getUserBookings,
  getUserReviews,
  getUserTransactions,
  getUserWishlist,
  disableUser,
  enableUser,
  forceLogoutUser,
  resetUserOtp,
  getUserLoginHistory,
  getUserSecurityLog,
  queueUserExport,
  getUserExportJob,
  downloadUserExport,
  userDisplayName,
  pickStat,
  formatMoney,
  humanizeKey,
} from './users';
export type {
  AdminUserListItem,
  AdminUserDetail,
  UserMetrics,
  UserActivityItem,
  UserBooking,
  UserReview,
  UserTransaction,
  UserWishlistItem,
  UserLoginEvent,
  UserSecurityLogEntry,
  ListUsersParams,
  UserExportJob,
  ListingRef,
} from './users';

// Partner management (admin partner workflow)
export {
  listPartners,
  getPartnerMetrics,
  getPartner,
  getPartnerReviewLogs,
  verifyPartner,
  unverifyPartner,
  verifyPartnerBank,
  approvePartner,
  rejectPartner,
  requestPartnerChanges,
  activatePartner,
  deactivatePartner,
  queuePartnerExport,
  getPartnerExportJob,
  downloadPartnerExport,
  partnerStatusLabel,
  partnerStatusTone,
  isPartnerOnboarding,
  PARTNER_STATUSES,
  PARTNER_CATEGORIES,
} from './partners';
export type {
  PartnerListItem,
  PartnerDetail,
  PartnerProfile,
  PartnerExtendedProfile,
  PartnerVerification,
  PartnerBankDetail,
  PartnerMedia,
  PartnerReviewLog,
  PartnerMetrics,
  PartnerStatus,
  ListPartnersParams,
  ExportJob,
} from './partners';

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

// Coupons & marketing (marketing API — not live yet)
export {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from './coupons';
export type {
  Coupon,
  CreateCouponInput,
  ListCouponsParams,
  CouponDiscountType,
  CouponAppliesTo,
} from './coupons';
