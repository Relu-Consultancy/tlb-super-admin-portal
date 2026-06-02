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

import { api } from './client';
import { helpPath } from './config';

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

/** GET tickets/ — all tickets, optionally filtered by category and/or status. */
export function listTickets(params?: ListTicketsParams): Promise<SupportTicket[]> {
  return api.get<SupportTicket[]>(helpPath('tickets/'), {
    params: params as Record<string, string | undefined>,
  });
}

/** GET tickets/{id}/ — single ticket detail. */
export function getTicket(ticketId: string): Promise<SupportTicket> {
  return api.get<SupportTicket>(helpPath(`tickets/${ticketId}/`));
}

/** GET tickets/{id}/messages/ — chat thread; pass `since` (ISO 8601) to poll incrementally. */
export function getTicketMessages(ticketId: string, since?: string): Promise<TicketMessage[]> {
  return api.get<TicketMessage[]>(helpPath(`tickets/${ticketId}/messages/`), {
    params: since ? { since } : undefined,
  });
}

/** POST tickets/{id}/messages/send/ — admin reply to a ticket. */
export function sendTicketMessage(ticketId: string, body: string): Promise<TicketMessage> {
  return api.post<TicketMessage>(helpPath(`tickets/${ticketId}/messages/send/`), { body });
}

/** PATCH tickets/{id}/update/ — update ticket status (resolve / close). */
export function updateTicketStatus(ticketId: string, status: string): Promise<SupportTicket> {
  return api.patch<SupportTicket>(helpPath(`tickets/${ticketId}/update/`), { status });
}
