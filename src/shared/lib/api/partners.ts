/**
 * Partner accounts service — `/accounts/partners/` (API doc §5).
 *
 * Disabling a partner deactivates BOTH the User and Partner records atomically.
 */

import { api } from './client';
import { adminPath } from './config';
import type { Paginated } from './types';

export interface Partner {
  id: string;
  email: string;
  auth_provider: string;
  is_active: boolean;
  disabled_reason: string;
  disabled_at: string | null;
  last_login: string | null;
  created_at: string;
  /** Onboarding/lifecycle status, e.g. "approved", "category_selected". */
  partner_status: string;
  partner_is_active: boolean;
}

export interface ListPartnersParams {
  /** Partial email match. */
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
}

/** GET /accounts/partners/ — paginated list of partners. */
export function listPartners(params?: ListPartnersParams): Promise<Paginated<Partner>> {
  return api.get<Paginated<Partner>>(adminPath('accounts/partners/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /accounts/partners/{id}/ — single partner detail. */
export function getPartner(userId: string): Promise<Partner> {
  return api.get<Partner>(adminPath(`accounts/partners/${userId}/`));
}

/** POST /accounts/partners/{id}/disable/ — disable User + Partner with a reason. */
export function disablePartner(userId: string, reason: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`accounts/partners/${userId}/disable/`), { reason });
}

/** POST /accounts/partners/{id}/enable/ — re-enable User + Partner. */
export function enablePartner(userId: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`accounts/partners/${userId}/enable/`));
}

/** Humanize a partner_status code, e.g. "category_selected" -> "Category selected". */
export function partnerStatusLabel(status: string): string {
  if (!status) return '—';
  const s = status.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Tailwind badge classes for a partner_status. */
export function partnerStatusTone(status: string): string {
  if (status === 'approved') return 'bg-green-50 text-green-600';
  if (/(reject|suspend|ban)/.test(status)) return 'bg-red-50 text-red-600';
  return 'bg-yellow-50 text-yellow-700';
}
