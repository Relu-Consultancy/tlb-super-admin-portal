import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupportSystem from './SupportSystem';

beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

const { authState } = vi.hoisted(() => ({ authState: { canManage: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({
        admin: { email: 'admin@tlb.com', role: 'SUPER_ADMIN' },
        hasPermission: () => authState.canManage,
    }),
}));

vi.mock('../../shared/lib/api', () => ({
    listTickets: vi.fn(),
    getTicket: vi.fn((id: string) => Promise.resolve({ id, raised_by_email: 'alice@x.com', raised_by_role: 'customer', category: 'refund_status', subject: 'Where is my refund', status: 'open', booking_reference: 'BK-1', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z' })),
    getTicketMessages: vi.fn(() => Promise.resolve([])),
    sendTicketMessage: vi.fn(() => Promise.resolve({ id: 'm-new', sender_email: 'admin@tlb.com', sender_role: 'admin', body: 'hi', is_read: false, created_at: '2026-06-02T13:00:00Z' })),
    updateTicketStatus: vi.fn((_id: string, status: string) => Promise.resolve({ id: 't-1', raised_by_email: 'user@x.com', raised_by_role: 'customer', category: 'refund_status', subject: 'Refund', status, booking_reference: 'BK-1', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z' })),
    ticketStatusLabel: (s: string) => s,
    ticketStatusTone: () => ({ color: 'text-gray-600', bg: 'bg-gray-100' }),
    ticketCategoryLabel: (c: string) => c,
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listTickets, getTicketMessages, updateTicketStatus } from '../../shared/lib/api';

const TICKETS = [
    { id: 't-1', raised_by_email: 'alice@x.com', raised_by_role: 'customer', category: 'refund_status', subject: 'Where is my refund', status: 'open', booking_reference: 'BK-1', created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-02T00:00:00Z' },
    { id: 't-2', raised_by_email: 'bob@x.com', raised_by_role: 'partner', category: 'payout', subject: 'Payout delay', status: 'resolved', booking_reference: null, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-02T00:00:00Z' },
];

describe('SupportSystem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.canManage = true;
        (listTickets as any).mockResolvedValue(TICKETS);
        (getTicketMessages as any).mockResolvedValue([]);
    });

    it('renders stat cards', async () => {
        render(<SupportSystem />);
        expect(screen.getByText('Total Tickets')).toBeInTheDocument();
        await waitFor(() => expect(listTickets).toHaveBeenCalled());
    });

    it('renders the search input', () => {
        render(<SupportSystem />);
        expect(screen.getByPlaceholderText('Search by email, subject, ID...')).toBeInTheDocument();
    });

    it('renders filter tabs with counts', async () => {
        render(<SupportSystem />);
        expect(await screen.findByText(/All \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText(/Open \(\d+\)/)).toBeInTheDocument();
        expect(screen.getByText(/Resolved \(\d+\)/)).toBeInTheDocument();
    });

    it('lists tickets fetched from the API', async () => {
        render(<SupportSystem />);
        expect(await screen.findByText('alice@x.com')).toBeInTheDocument();
        expect(screen.getByText('bob@x.com')).toBeInTheDocument();
    });

    it('shows a placeholder in the chat panel when no ticket is selected', () => {
        render(<SupportSystem />);
        expect(screen.getByText('Select a ticket to start')).toBeInTheDocument();
    });

    it('opens a ticket thread and resolves it', async () => {
        render(<SupportSystem />);
        await userEvent.click(await screen.findByText('alice@x.com'));
        await waitFor(() => expect(getTicketMessages).toHaveBeenCalledWith('t-1'));
        await userEvent.click(await screen.findByRole('button', { name: /Mark as Resolved/i }));
        await waitFor(() => expect(updateTicketStatus).toHaveBeenCalledWith('t-1', 'resolved'));
    });

    it('hides reply actions without MANAGE_ENQUIRIES', async () => {
        authState.canManage = false;
        render(<SupportSystem />);
        await userEvent.click(await screen.findByText('alice@x.com'));
        expect(await screen.findByText(/don't have permission to reply/i)).toBeInTheDocument();
    });
});
