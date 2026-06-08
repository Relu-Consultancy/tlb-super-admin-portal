/**
 * Payments & Finance service — `/api/v1/admin/finance/`.
 *
 * Phase 1: the Transactions tab — list successful payments (online Razorpay +
 * manual/offline), view detail, register a manual payment against a booking,
 * and export the filtered list to CSV (async job).
 *
 * Permissions: VIEW_TRANSACTIONS (list/detail), RECORD_PAYMENTS (register),
 * EXPORT_REPORTS (export).
 *
 * NOTE: amounts are decimal STRINGS in INR (e.g. "500.00"); dates are ISO UTC.
 */

import { api } from './client';
import { adminPath, API_BASE_URL } from './config';
import { getAccessToken } from './token';
import type { Paginated } from './types';

export const TRANSACTION_SOURCES = ['online', 'manual'] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

/** Manual-payment modes (value + display label). */
export const PAYMENT_MODES: { value: string; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

export const BOOKING_TYPES = ['event', 'venue', 'program', 'class'] as const;

export const FINANCE_PERIODS = ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'custom'] as const;
export type FinancePeriod = (typeof FINANCE_PERIODS)[number];
export const FINANCE_PERIOD_LABELS: Record<FinancePeriod, string> = {
  today: 'Today', yesterday: 'Yesterday', this_week: 'This Week', last_week: 'Last Week', this_month: 'This Month', custom: 'Custom',
};

export interface TransactionListItem {
  transaction_id: string;
  transaction_type: string;
  source: string;
  status: string;
  amount: string;
  currency: string;
  customer_email: string | null;
  partner_name: string | null;
  booking_reference: string | null;
  booking_type: string | null;
  payment_mode: string | null;
  payment_method: string | null;
  external_reference: string | null;
  date: string;
}

export interface TransactionBooking {
  id: string;
  booking_reference: string;
  booking_type: string;
  status: string;
  listing_title: string;
  original_amount: string;
  discount_amount: string;
  platform_fee: string;
  total_amount: string;
}

export interface PaymentDetail {
  payment_method: string | null;
  payment_status: string | null;
  card_last4: string | null;
  card_network: string | null;
  card_issuer: string | null;
  card_type: string | null;
  upi_vpa_masked: string | null;
  bank_name: string | null;
  wallet_name: string | null;
}

export interface TransactionDetail {
  transaction_id: string;
  transaction_type: string;
  source: string;
  status: string;
  amount: string;
  currency: string;
  payment_mode: string | null;
  external_reference: string | null;
  notes: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  booking: TransactionBooking | null;
  customer: { email: string; name: string } | null;
  partner: { name: string } | null;
  payment_detail: PaymentDetail | null;
  registered_by: { id: string; email: string } | null;
  created_at: string;
}

export interface RegisterPaymentInput {
  booking_id: string;
  amount: string;
  payment_mode: string;
  external_reference?: string;
  notes?: string;
}

export interface ListTransactionsParams {
  period?: string;
  date_from?: string;
  date_to?: string;
  source?: string;
  payment_mode?: string;
  partner_id?: string;
  booking_type?: string;
  min_amount?: string;
  max_amount?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface FinanceExportJob {
  job_id: string;
  status: string;
  row_count: number;
  created_at: string;
  error: string | null;
}

/** GET /finance/transactions/ — paginated list of successful payments. */
export function listTransactions(params?: ListTransactionsParams): Promise<Paginated<TransactionListItem>> {
  return api.get<Paginated<TransactionListItem>>(adminPath('finance/transactions/'), {
    params: params as Record<string, string | number | undefined>,
  });
}

/** GET /finance/transactions/{id}/ — full transaction detail. */
export function getTransaction(transactionId: string): Promise<TransactionDetail> {
  return api.get<TransactionDetail>(adminPath(`finance/transactions/${transactionId}/`));
}

/** POST /finance/transactions/register/ — record an offline payment (confirms the booking). */
export function registerPayment(input: RegisterPaymentInput): Promise<TransactionDetail> {
  return api.post<TransactionDetail>(adminPath('finance/transactions/register/'), input);
}

// --- CSV export (queue → poll → download) ---

/** POST /finance/transactions/export/ — start an async CSV export (same filters as the list). */
export function queueTransactionExport(filters?: ListTransactionsParams): Promise<FinanceExportJob> {
  return api.post<FinanceExportJob>(adminPath('finance/transactions/export/'), filters ?? {});
}

/** GET /finance/transactions/export/{job_id}/ — poll export job status. */
export function getTransactionExportJob(jobId: string): Promise<FinanceExportJob> {
  return api.get<FinanceExportJob>(adminPath(`finance/transactions/export/${jobId}/`));
}

/** GET /finance/transactions/export/{job_id}/download/ — fetch the finished CSV (authenticated blob). */
export async function downloadTransactionExport(jobId: string): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${adminPath(`finance/transactions/export/${jobId}/download/`)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
}

// --- Display helpers ---

/** Label for a payment source. */
export function sourceLabel(source: string): string {
  return source === 'online' ? 'Online' : source === 'manual' ? 'Manual' : source || '—';
}

/** Tailwind badge classes for a payment source. */
export function sourceTone(source: string): string {
  return source === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600';
}

/** Display label for a manual payment mode. */
export function paymentModeLabel(mode: string | null | undefined): string {
  if (!mode) return '—';
  return PAYMENT_MODES.find((m) => m.value === mode)?.label ?? mode;
}

/** Humanize a booking type, e.g. `event` -> "Event". */
export function bookingTypeLabel(type: string | null | undefined): string {
  if (!type) return '—';
  return type.charAt(0).toUpperCase() + type.slice(1);
}
