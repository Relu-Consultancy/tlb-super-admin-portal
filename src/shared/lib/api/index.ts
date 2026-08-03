/**
 * Barrel export for the API layer.
 *
 *   import { api, ApiError, login, getProfile } from '@/shared/lib/api';
 *
 * Internal structure:
 *   core/        — HTTP client, config, token helpers, roles & shared types
 *   auth/        — Authentication (login/logout/password) & profile/sessions
 *   admins/      — Admin user management (RBAC, force-logout, unlock)
 *   users/       — Customer management (bookings, reviews, exports)
 *   partners/    — Partner onboarding, verification & export
 *   listings/    — Listing moderation & homepage section curation
 *   finance/     — Transactions, payments & financial reporting
 *   analytics/   — Dashboard stats & engagement analytics
 *   marketing/   — Coupons & broadcast notifications
 *   support/     — Help-desk ticket management
 *   audit/       — Audit logs
 *   tlb/         — TLB Signature first-party listings
 */

// ── Core infrastructure ──────────────────────────────────────────────────────
export { api, ApiError, SESSION_EXPIRED_EVENT } from './core/client';
export type { RequestOptions, SessionExpiredDetail } from './core/client';
export { API_BASE_URL, API_TIMEOUT, ADMIN_API_PREFIX, adminPath, HELP_ADMIN_PREFIX, helpPath, mediaUrl } from './core/config';

// Token storage
export {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  hasSession,
} from './core/token';
export type { TokenPair } from './core/token';

// Roles & permissions
export {
  ADMIN_ROLES,
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  roleLabel,
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  permissionLabel,
} from './core/roles';
export type { AdminRole, Permission } from './core/roles';

// Shared types
export type { Paginated } from './core/types';

// ── Auth ─────────────────────────────────────────────────────────────────────
export {
  login,
  refresh,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
} from './auth/auth';
export type { AdminUser, LoginResponse, RefreshResponse } from './auth/auth';

// Profile & sessions
export { getProfile, getSessions } from './auth/profile';
export type { AdminProfile, AdminSession } from './auth/profile';

// ── Admin management ─────────────────────────────────────────────────────────
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
} from './admins/admins';
export type { AdminListItem, ListAdminsParams, AdminDetail, CreateAdminPayload } from './admins/admins';

// ── User (customer) management ───────────────────────────────────────────────
export {
  listUsers,
  listUsersPaginated,
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
} from './users/users';
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
} from './users/users';

// ── Partner management ───────────────────────────────────────────────────────
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
} from './partners/partners';
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
} from './partners/partners';

// ── Listing moderation ───────────────────────────────────────────────────────
export {
  listListings,
  getListingStats,
  getListing,
  getListingHistory,
  approveListing,
  rejectListing,
  getListingRejectionReasons,
  setListingVisibility,
  listingStatusLabel,
  listingStatusTone,
  listingTypeLabel,
  listingTypeTone,
  listingCategoryName,
  LISTING_TYPES,
  LISTING_STATUSES,
} from './listings/listings';
export type {
  ListingListItem,
  ListingDetail,
  ListingMedia,
  ListingReviewLog,
  ListingStats,
  ListingType,
  ListingStatus,
  ListingCategory,
  CategoryRef,
  ListListingsParams,
  RejectionReason,
} from './listings/listings';

// Listing sections (UserApp homepage/discovery curation)
export {
  listSections,
  getSectionRows,
  addToSection,
  removeFromSection,
  setSection,
  sectionLabel,
  sectionErrorMessage,
  SECTION_ERROR_LABELS,
  SECTION_MIN_LISTINGS,
  SECTION_MAX_LISTINGS,
  TLB_SIGNATURE_SECTION,
  ALIGNMENT_PAGES,
} from './listings/listingSections';
export type {
  AlignmentSection,
  AlignmentPage,
  AlignmentPageId,
  SectionListing,
  SectionListingRef,
} from './listings/listingSections';

// ── Finance ──────────────────────────────────────────────────────────────────
export {
  listTransactions,
  getTransaction,
  registerPayment,
  queueTransactionExport,
  getTransactionExportJob,
  downloadTransactionExport,
  getFinanceSummary,
  getFinanceDashboard,
  queueSummaryExport,
  getSummaryExportJob,
  downloadSummaryExport,
  sourceLabel,
  sourceTone,
  paymentModeLabel,
  bookingTypeLabel,
  TRANSACTION_SOURCES,
  PAYMENT_MODES,
  BOOKING_TYPES,
  FINANCE_PERIODS,
  FINANCE_PERIOD_LABELS,
} from './finance/finance';
export type {
  TransactionListItem,
  TransactionDetail,
  TransactionBooking,
  PaymentDetail,
  RegisterPaymentInput,
  ListTransactionsParams,
  FinanceExportJob,
  FinanceParams,
  FinanceSummary,
  FinanceDashboardData,
  FinanceTrendPoint,
  TransactionSource,
  FinancePeriod,
} from './finance/finance';

// ── Analytics & Stats ────────────────────────────────────────────────────────
export {
  getOverviewStats,
  getCustomerStats,
  getPartnerStats,
  parseAmount,
  safeCurrency,
  STATS_PERIODS,
  STATS_PERIOD_LABELS,
} from './analytics/stats';
export type {
  StatsParams,
  StatsPeriod,
  StatsPeriodInfo,
  OverviewStats,
  CustomerStats,
  PartnerStats,
  OverviewRevenue,
  OverviewTrendPoint,
  RecentBooking,
  RecentSignup,
  RecentTicket,
  TopCustomer,
  TopPartner,
} from './analytics/stats';

// Activity engagement & top-viewed listings
export {
  getActivitySummary,
  getTopViewedListings,
  analyticsErrorMessage,
} from './analytics/analytics';
export type {
  AnalyticsParams,
  ActivityGroupStats,
  ActivityEventStat,
  ActivitySummary,
  TopViewedListing,
  TopViewedListingsResponse,
  TopViewedListingsParams,
} from './analytics/analytics';

// ── Marketing ────────────────────────────────────────────────────────────────
export {
  listBroadcasts,
  createBroadcast,
  getBroadcast,
  cancelBroadcast,
  listDeliveries,
  sendBroadcastTest,
  estimateAudience,
  broadcastStatusLabel,
  broadcastStatusTone,
  deliveryStatusTone,
  isBroadcastCancellable,
  BROADCAST_STATUSES,
  BROADCAST_AUDIENCES,
  DELIVERY_CHANNELS,
  DELIVERY_STATUSES,
} from './marketing/broadcasts';
export type {
  BroadcastListItem,
  BroadcastDetail,
  BroadcastDelivery,
  CreateBroadcastInput,
  ListBroadcastsParams,
  DeliveriesParams,
  BroadcastStatus,
  BroadcastAudience,
  DeliveryChannel,
  DeliveryStatus,
} from './marketing/broadcasts';

// Coupons
export {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  activateCoupon,
  deactivateCoupon,
  getCouponUsages,
  getPlatformCouponAnalytics,
  getPartnerCouponAnalytics,
  getTopCoupons,
  getCouponUsageOverTime,
  getRedemptionReport,
  couponDiscountLabel,
  couponTypeLabel,
  couponTypeTone,
  isCouponExpired,
  COUPON_TYPES,
  DISCOUNT_TYPES,
} from './marketing/coupons';
export type {
  CouponListItem,
  CouponDetail,
  CouponUsage,
  CouponInput,
  ListCouponsParams,
  CouponAnalytics,
  TopCoupon,
  UsageOverTimePoint,
  RedemptionRow,
  RedemptionParams,
  TargetListing,
  TargetCategory,
  CouponType,
  DiscountType,
} from './marketing/coupons';

// ── Support ──────────────────────────────────────────────────────────────────
export {
  listTickets,
  getTicket,
  getTicketMessages,
  sendTicketMessage,
  updateTicketStatus,
  shareTicketWithPartner,
  ticketStatusLabel,
  ticketStatusTone,
  ticketCategoryLabel,
  ticketPollInterval,
  TICKET_STATUSES,
} from './support/support';
export type { SupportTicket, TicketMessage, TicketThread, TicketStatus, ListTicketsParams } from './support/support';

// ── Audit logs ───────────────────────────────────────────────────────────────
export {
  getAuditLogs,
  auditActionLabel,
  auditActionTone,
  AUDIT_ACTIONS,
} from './audit/auditLogs';
export type { AuditLog, AuditAction, AuditLogParams } from './audit/auditLogs';

// ── TLB Signature ────────────────────────────────────────────────────────────
export {
  listTlbSignature,
  getTlbSignature,
  archiveTlbSignature,
  updateTlbSignature,
  toggleTlbVisibility,
  createTlbEvent,
  createTlbClass,
  createTlbProgram,
  createTlbVenue,
  tlbErrorMessage,
  TLB_ERROR_LABELS,
  TLB_STATUSES,
  TLB_CREATE_TYPES,
} from './tlb/tlbSignature';
export type {
  TlbListItem,
  TlbDetail,
  ListTlbParams,
  TlbStatus,
  TlbCreateType,
  TlbEventInput,
  TlbEventTicket,
  TlbClassInput,
  TlbClassBatch,
  TlbProgramInput,
  TlbProgramBatch,
  TlbVenueInput,
  TlbVenuePackage,
  TlbUpdateInput,
} from './tlb/tlbSignature';
