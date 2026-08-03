/**
 * Support tickets service — Help / Admin endpoints (`/api/v1/help/admin/`).
 *
 * Endpoints:
 *   GET   tickets/                         — list all tickets (filter by category/status)
 *   GET   tickets/{id}/                    — ticket detail
 *   GET   tickets/{id}/messages/           — chat thread (optional `since` cursor)
 *   POST  tickets/{id}/messages/send/      — admin reply
 *   PATCH tickets/{id}/update/             — change status (resolve / close)
 */

import { api } from '../core/client';
import { helpPath } from '../core/config';

/** Lifecycle states a ticket moves through. */
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface SupportTicket {
  id: string;
  raised_by_email: string;
  raised_by_role: string;
  category: string;
  subject: string;
  status: string;
  booking_reference: string | null;
  shared_with_partner_id: string | null;
  shared_with_partner_name: string | null;
  shared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  sender_email: string;
  sender_role: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/** The messages endpoint returns the thread wrapped with the live ticket status. */
export interface TicketThread {
  ticket_status: string;
  messages: TicketMessage[];
}

/**
 * Recommended poll cadence (ms) per ticket status, per the integration guide.
 * `null` means stop polling (a closed ticket accepts no further messages).
 */
export function ticketPollInterval(status: string): number | null {
  switch (status) {
    case 'in_progress':
      return 5_000;
    case 'open':
      return 30_000;
    case 'resolved':
      return 60_000;
    case 'closed':
      return null;
    default:
      return 15_000;
  }
}

export interface ListTicketsParams {
  category?: string;
  status?: string;
}

/** Human-friendly label for a ticket status, e.g. `in_progress` -> "In Progress". */
export function ticketStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Tailwind tone (text + bg) classes for a ticket status badge. */
export function ticketStatusTone(status: string): { color: string; bg: string } {
  switch (status) {
    case 'open':
      return { color: 'text-orange-600', bg: 'bg-orange-50' };
    case 'in_progress':
      return { color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'resolved':
      return { color: 'text-green-600', bg: 'bg-green-50' };
    case 'closed':
      return { color: 'text-gray-600', bg: 'bg-gray-100' };
    default:
      return { color: 'text-gray-600', bg: 'bg-gray-100' };
  }
}

/** Humanize a category code, e.g. `refund_status` -> "Refund Status". */
export function ticketCategoryLabel(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Normalize an array-or-paginated response into a plain array. */
function asArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { results?: T[] }).results)) {
    return (res as { results: T[] }).results;
  }
  return [];
}

/**
 * GET tickets/ — all tickets, optionally filtered by category and/or status.
 *
 * The docs show a bare array, but (as the events endpoint proved) the backend
 * may actually paginate. Normalize either shape and follow every page so the
 * list can never silently truncate.
 */
export async function listTickets(params?: ListTicketsParams): Promise<SupportTicket[]> {
  const base = (params ?? {}) as Record<string, string | number | undefined>;
  const first = await api.get<unknown>(helpPath('tickets/'), { params: { ...base, page_size: 100 } });
  if (Array.isArray(first)) return first as SupportTicket[];

  const all = asArray<SupportTicket>(first);
  const count = (first as { count?: unknown })?.count;
  if (typeof count !== 'number') return all;

  for (let page = 2; all.length < count && page < 100; page++) {
    const res = await api.get<unknown>(helpPath('tickets/'), { params: { ...base, page_size: 100, page } });
    const rows = asArray<SupportTicket>(res);
    if (rows.length === 0) break;
    all.push(...rows);
  }
  return all;
}

/** GET tickets/{id}/ — single ticket detail. */
export function getTicket(ticketId: string): Promise<SupportTicket> {
  return api.get<SupportTicket>(helpPath(`tickets/${ticketId}/`));
}

/**
 * GET tickets/{id}/messages/ — chat thread, wrapped as `{ ticket_status, messages }`.
 *
 * Pass `since` (the previous last message's `created_at`, verbatim UTC) to fetch
 * only newer messages; omit it for a full load. Older API builds returned a bare
 * array — both shapes are normalized here. Note: fetching marks unread as read.
 */
export async function getTicketMessages(ticketId: string, since?: string): Promise<TicketThread> {
  const res = await api.get<unknown>(helpPath(`tickets/${ticketId}/messages/`), {
    params: since ? { since } : undefined,
  });
  if (Array.isArray(res)) return { ticket_status: '', messages: res as TicketMessage[] };
  const obj = (res ?? {}) as { ticket_status?: string; messages?: unknown };
  return {
    ticket_status: obj.ticket_status ?? '',
    messages: asArray<TicketMessage>(obj.messages ?? res),
  };
}

/** POST tickets/{id}/messages/send/ — admin reply to a ticket. */
export function sendTicketMessage(ticketId: string, body: string): Promise<TicketMessage> {
  return api.post<TicketMessage>(helpPath(`tickets/${ticketId}/messages/send/`), { body });
}

/** PATCH tickets/{id}/update/ — update ticket status (resolve / close). */
export function updateTicketStatus(ticketId: string, status: string): Promise<SupportTicket> {
  return api.patch<SupportTicket>(helpPath(`tickets/${ticketId}/update/`), { status });
}

/**
 * POST tickets/{id}/share/ — share a customer query with a partner.
 *
 * Loops the partner into the ticket thread. The optional note is posted as an
 * admin message so the partner has context. Only customer-raised tickets can
 * be shared (partner-raised tickets return SHARE_NOT_ALLOWED).
 */
export function shareTicketWithPartner(
  ticketId: string,
  partnerId: string,
  note?: string,
): Promise<SupportTicket> {
  const body: Record<string, unknown> = { partner_id: partnerId };
  if (note?.trim()) body.note = note.trim();
  return api.post<SupportTicket>(helpPath(`tickets/${ticketId}/share/`), body);
}
