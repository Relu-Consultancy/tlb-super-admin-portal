/**
 * Customer accounts service — `/accounts/users/` (API doc §5).
 */

import { api } from './client';
import { adminPath } from './config';
import type { Paginated } from './types';

export interface Customer {
  id: string;
  email: string;
  role: string;
  auth_provider: string;
  is_active: boolean;
  is_verified: boolean;
  disabled_reason: string;
  disabled_at: string | null;
  last_login: string | null;
  created_at: string;
}

export interface ListCustomersParams {
  /** Partial email match. */
  search?: string;
  is_active?: boolean;
  /** e.g. `-created_at`, `email`. */
  ordering?: string;
  page?: number;
}

/** GET /accounts/users/ — paginated list of customers. */
export function listCustomers(params?: ListCustomersParams): Promise<Paginated<Customer>> {
  return api.get<Paginated<Customer>>(adminPath('accounts/users/'), {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** GET /accounts/users/{id}/ — single customer detail. */
export function getCustomer(userId: string): Promise<Customer> {
  return api.get<Customer>(adminPath(`accounts/users/${userId}/`));
}

/** POST /accounts/users/{id}/disable/ — disable with a reason. */
export function disableCustomer(userId: string, reason: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`accounts/users/${userId}/disable/`), { reason });
}

/** POST /accounts/users/{id}/enable/ — re-enable a disabled customer. */
export function enableCustomer(userId: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(adminPath(`accounts/users/${userId}/enable/`));
}
