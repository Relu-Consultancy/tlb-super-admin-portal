/**
 * Admin Partner Management service — `/api/v1/admin/partners/`.
 *
 * Covers the full onboarding/review workflow:
 *   list (advanced filters) · metrics · full profile detail · review logs ·
 *   verify / verify-bank / unverify · approve / reject / request-changes ·
 *   activate / deactivate · CSV export (queue → poll → download).
 *
 * Lifecycle: initiated → profile_created → under_review →
 *            (approved | activated_limited → under_review | rejected)
 */

import { api } from './client';
import { adminPath, API_BASE_URL } from './config';
import { getAccessToken } from './token';

/** Known partner lifecycle statuses (roughly in onboarding order). */
export const PARTNER_STATUSES = [
  'initiated',
  'category_selected',
  'profile_created',
  'under_review',
  'activated_limited',
  'approved',
  'rejected',
] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

/**
 * Statuses where the partner is in the review pipeline or has a final decision.
 * Anything outside this set means the partner is still setting up their
 * account (initiated / category_selected / profile_created / unknown) and
 * hasn't submitted for review yet — i.e. a "new" / incomplete partner.
 */
const PIPELINE_OR_DECIDED = new Set<string>(['under_review', 'activated_limited', 'approved', 'rejected']);

/** True when the partner is still onboarding (hasn't reached review yet). */
export function isPartnerOnboarding(status: string): boolean {
  return !PIPELINE_OR_DECIDED.has(status);
}

/** Categories the platform supports (per the API filter docs). */
export const PARTNER_CATEGORIES = ['Events', 'Classes', 'Programs', 'Venues', 'Shop'] as const;

/** Row shape returned by the list endpoint. */
export interface PartnerListItem {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  contact_person_name: string;
  base_city: string;
  categories: string[];
  status: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface PartnerProfile {
  business_name: string;
  business_type: string;
  contact_person_name: string;
  email: string;
  base_city: string;
  instagram_url: string;
  facebook_url: string;
  website_url: string;
  is_safety_confirmed: boolean;
  is_info_correct: boolean;
}

export interface PartnerExtendedProfile {
  bio: string;
  logo: string;
  cover_image: string;
  contact_number: string;
}

export interface PartnerVerification {
  pan_number: string;
  gst_number: string;
  is_pan_verified: boolean;
}

export interface PartnerBankDetail {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  is_verified: boolean;
}

export interface PartnerMedia {
  id: number;
  file: string;
  media_type: string;
}

/** Full partner profile from the detail endpoint. */
export interface PartnerDetail {
  id: string;
  email: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile: PartnerProfile | null;
  extended_profile: PartnerExtendedProfile | null;
  verification: PartnerVerification | null;
  bank_detail: PartnerBankDetail | null;
  categories: string[];
  operating_cities: string[];
  media: PartnerMedia[];
  follower_count: number;
  agreement_accepted_at: string | null;
  review_logs: unknown[];
}

export interface PartnerReviewLog {
  id: number;
  decision: string;
  comment: string;
  reviewed_by_admin_email: string;
  created_at: string;
}

export interface PartnerMetrics {
  total_partners: number;
  approved: number;
  under_review: number;
  rejected: number;
  activated_limited: number;
  profile_created: number;
  is_active_count: number;
  is_verified_count: number;
  new_this_month: number;
}

export interface ListPartnersParams {
  /** Filter by email, business name, or contact person name. */
  search?: string;
  /** Partner.Status value, e.g. `approved`, `under_review`. */
  status?: string;
  /** Category name (Events, Classes, Programs, Venues, Shop). */
  category?: string;
  /** Partial match on base/operating city. */
  city?: string;
  is_active?: boolean;
  is_verified?: boolean;
  /** ISO date — created_at >= date_from. */
  date_from?: string;
  /** ISO date — created_at <= date_to. */
  date_to?: string;
  /** Field to order by (default `-created_at`). */
  ordering?: string;
}

export interface ExportJob {
  job_id: string;
  status: string;
  row_count?: number;
  download_url?: string;
  error?: string;
  created_at?: string;
}

/** Normalize an array-or-paginated response into a plain array. */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { results?: T[] }).results)) {
    return (res as { results: T[] }).results;
  }
  return [];
}

/** GET /partners/ — list partners with advanced filters. */
export async function listPartners(params?: ListPartnersParams): Promise<PartnerListItem[]> {
  const res = await api.get<unknown>(adminPath('partners/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  return asArray<PartnerListItem>(res);
}

/**
 * GET /partners/metrics/ — aggregate counts by status, activity, verification.
 * Optionally scoped to a `date_from`/`date_to` window (period-based counts like
 * "new partners" reflect the range; the backend ignores the params if unsupported).
 */
export function getPartnerMetrics(params?: { date_from?: string; date_to?: string }): Promise<PartnerMetrics> {
  return api.get<PartnerMetrics>(adminPath('partners/metrics/'), {
    params: params as Record<string, string | undefined>,
  });
}

/** GET /partners/{id}/ — full partner profile detail. */
export function getPartner(partnerId: string): Promise<PartnerDetail> {
  return api.get<PartnerDetail>(adminPath(`partners/${partnerId}/`));
}

/** GET /partners/{id}/review-logs/ — review decision history. */
export async function getPartnerReviewLogs(partnerId: string): Promise<PartnerReviewLog[]> {
  const res = await api.get<unknown>(adminPath(`partners/${partnerId}/review-logs/`));
  return asArray<PartnerReviewLog>(res);
}

// --- Verification ---

/** POST /partners/{id}/verify/ — mark verified (is_verified=True, PAN verified). */
export function verifyPartner(partnerId: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/verify/`));
}

/** POST /partners/{id}/unverify/ — mark unverified. Reason required. */
export function unverifyPartner(partnerId: string, reason: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/unverify/`), { reason });
}

/** POST /partners/{id}/verify-bank/ — mark the partner's bank details verified. */
export function verifyPartnerBank(partnerId: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/verify-bank/`));
}

// --- Review decisions ---

/** POST /partners/{id}/approve/ — under_review → approved (is_active=True). */
export function approvePartner(partnerId: string, comment?: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/approve/`), { comment: comment ?? '' });
}

/** POST /partners/{id}/reject/ — → rejected (is_active=False). Reason required. */
export function rejectPartner(partnerId: string, reason: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/reject/`), { reason });
}

/** POST /partners/{id}/request-changes/ — under_review → activated_limited. Comment required. */
export function requestPartnerChanges(partnerId: string, comment: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/request-changes/`), { comment });
}

// --- Account activation ---

/** POST /partners/{id}/activate/ — activate the partner account. */
export function activatePartner(partnerId: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/activate/`));
}

/** POST /partners/{id}/deactivate/ — deactivate the account. Reason required. */
export function deactivatePartner(partnerId: string, reason: string): Promise<unknown> {
  return api.post(adminPath(`partners/${partnerId}/deactivate/`), { reason });
}

// --- CSV export (queue → poll → download) ---

/** POST /partners/export/ — queue a CSV export job (same filters as the list). */
export function queuePartnerExport(params?: ListPartnersParams): Promise<ExportJob> {
  return api.post<ExportJob>(adminPath('partners/export/'), undefined, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /partners/export/{job_id}/ — poll an export job's status. */
export function getPartnerExportJob(jobId: string): Promise<ExportJob> {
  return api.get<ExportJob>(adminPath(`partners/export/${jobId}/`));
}

/**
 * GET /partners/export/{job_id}/download/ — fetch the finished CSV as a Blob
 * (authenticated, so we can't just point a link at it).
 */
export async function downloadPartnerExport(jobId: string): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${adminPath(`partners/export/${jobId}/download/`)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}

// --- Display helpers ---

/** Humanize a partner status code, e.g. `under_review` -> "Under Review". */
export function partnerStatusLabel(status: string): string {
  if (!status) return '—';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Tailwind badge classes (text + bg) for a partner status. */
export function partnerStatusTone(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-50 text-green-600';
    case 'under_review':
      return 'bg-blue-50 text-blue-600';
    case 'activated_limited':
      return 'bg-amber-50 text-amber-600';
    case 'rejected':
      return 'bg-red-50 text-red-600';
    case 'profile_created':
      return 'bg-indigo-50 text-indigo-600';
    case 'category_selected':
    case 'initiated':
      return 'bg-yellow-50 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}
