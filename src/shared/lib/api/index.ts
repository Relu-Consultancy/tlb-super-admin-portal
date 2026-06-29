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

// Listing moderation (unified admin listing approval workflow — all types)
export {
  listListings,
  getListingStats,
  getListing,
  getListingHistory,
  approveListing,
  rejectListing,
  setListingVisibility,
  listingStatusLabel,
  listingStatusTone,
  listingTypeLabel,
  listingTypeTone,
  listingCategoryName,
  LISTING_TYPES,
  LISTING_STATUSES,
} from './listings';
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
} from './listings';

// Listing sections (UserApp Alignment — homepage + discovery-screen curation)
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
} from './listingSections';
export type {
  AlignmentSection,
  AlignmentPage,
  AlignmentPageId,
  SectionListing,
  SectionListingRef,
} from './listingSections';

// TLB Signature listings (admin-authored first-party listings)
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
} from './tlbSignature';
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
} from './tlbSignature';

// Payments & Finance (transactions — Phase 1)
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
} from './finance';
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
} from './finance';

// Admin statistics (dashboard analytics)
export {
  getOverviewStats,
  getCustomerStats,
  getPartnerStats,
  parseAmount,
  safeCurrency,
  STATS_PERIODS,
  STATS_PERIOD_LABELS,
} from './stats';
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
} from './stats';

// Broadcasts (admin mass-notification engine)
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
} from './broadcasts';
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
} from './broadcasts';

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
  ticketPollInterval,
  TICKET_STATUSES,
} from './support';
export type { SupportTicket, TicketMessage, TicketThread, TicketStatus, ListTicketsParams } from './support';

// Admin coupons (platform + partner) with analytics & redemption report
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
} from './coupons';
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
} from './coupons';
