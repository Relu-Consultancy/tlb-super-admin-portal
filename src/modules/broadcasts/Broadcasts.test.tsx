import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Broadcasts from './Broadcasts';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, {
            get(_: any, tag: string) {
                if (!cache[tag]) {
                    cache[tag] = ({ children, ...props }: any) => {
                        const { initial, animate, exit, transition, layoutId, ...rest } = props;
                        return React.createElement(tag as any, rest, children);
                    };
                }
                return cache[tag];
            },
        }),
        AnimatePresence: ({ children }: any) => children,
    };
});

const { authState } = vi.hoisted(() => ({ authState: { canSend: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: (p: string) => (p === 'MANAGE_ADMINS' ? authState.canSend : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
    listBroadcasts: vi.fn(),
    createBroadcast: vi.fn(),
    getBroadcast: vi.fn(),
    cancelBroadcast: vi.fn(),
    listDeliveries: vi.fn(() => Promise.resolve([])),
    sendBroadcastTest: vi.fn(() => Promise.resolve({ detail: 'Test sent' })),
    estimateAudience: vi.fn(() => Promise.resolve({ count: 500 })),
    broadcastStatusLabel: (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '—'),
    broadcastStatusTone: () => 'bg-gray-100 text-gray-600',
    deliveryStatusTone: () => 'bg-gray-100 text-gray-600',
    isBroadcastCancellable: (s: string) => s === 'SCHEDULED' || s === 'SENDING',
    BROADCAST_STATUSES: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED'],
    BROADCAST_AUDIENCES: [
        { value: 'all', label: 'Everyone', hint: 'All users and partners', filters: {} },
        { value: 'customers', label: 'Customers (User App)', hint: 'Customer accounts only', filters: { roles: ['customer'] } },
        { value: 'partners', label: 'Partners (Partner Portal)', hint: 'Partner accounts only', filters: { roles: ['partner'] } },
    ],
    DELIVERY_CHANNELS: ['EMAIL', 'IN_APP'],
    DELIVERY_STATUSES: ['PENDING', 'SENT', 'FAILED', 'BOUNCED'],
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listBroadcasts, createBroadcast, estimateAudience, sendBroadcastTest, getBroadcast } from '../../shared/lib/api';

const LIST = [
    { id: 'b-1', title: 'June update', status: 'SENT', send_email: true, send_in_app: true, scheduled_at: null, sent_at: '2026-06-05T10:00:00Z', estimated_recipients: 500, total_recipients: 500, total_sent: 490, total_failed: 10, created_by_name: 'Admin', created_at: '2026-06-05T09:00:00Z' },
];

const CREATED = {
    id: 'b-9', title: 'New one', subject: 'Hi', body: 'Body', action_url: null, send_email: true, send_in_app: true,
    audience_filters: {}, status: 'SENDING', scheduled_at: null, sent_at: null, cancelled_at: null,
    estimated_recipients: 500, total_recipients: 500, total_sent: 0, total_failed: 0, created_by_name: 'Admin',
    cancelled_by_name: null, delivery_stats: null, created_at: '2026-06-08T00:00:00Z', updated_at: '2026-06-08T00:00:00Z',
};

describe('Broadcasts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.canSend = true;
        (listBroadcasts as any).mockResolvedValue(LIST);
        (createBroadcast as any).mockResolvedValue(CREATED);
        (getBroadcast as any).mockResolvedValue(CREATED);
        (estimateAudience as any).mockResolvedValue({ count: 500 });
    });

    it('renders the list with broadcasts', async () => {
        render(<Broadcasts />);
        expect(screen.getByText('Broadcasts')).toBeInTheDocument();
        expect(await screen.findByText('June update')).toBeInTheDocument();
    });

    it('hides New Broadcast without MANAGE_ADMINS', async () => {
        authState.canSend = false;
        render(<Broadcasts />);
        await screen.findByText('June update');
        expect(screen.queryByRole('button', { name: /New Broadcast/i })).not.toBeInTheDocument();
    });

    it('opens the composer and shows a live audience estimate', async () => {
        render(<Broadcasts />);
        await userEvent.click(await screen.findByRole('button', { name: /New Broadcast/i }));
        expect(await screen.findByText('New Broadcast')).toBeInTheDocument();
        await waitFor(() => expect(estimateAudience).toHaveBeenCalledWith({}));
        expect(await screen.findByText(/500/)).toBeInTheDocument();
    });

    it('re-estimates when the audience changes to partners', async () => {
        render(<Broadcasts />);
        await userEvent.click(await screen.findByRole('button', { name: /New Broadcast/i }));
        await screen.findByText('New Broadcast');
        await userEvent.selectOptions(screen.getByDisplayValue('Everyone'), 'partners');
        await waitFor(() => expect(estimateAudience).toHaveBeenCalledWith({ roles: ['partner'] }));
    });

    it('requires confirmation before an immediate send', async () => {
        render(<Broadcasts />);
        await userEvent.click(await screen.findByRole('button', { name: /New Broadcast/i }));
        await screen.findByText('New Broadcast');
        await userEvent.type(screen.getByPlaceholderText(/June feature announcement/i), 'Promo');
        await userEvent.type(screen.getByPlaceholderText(/New events are live/i), 'Subject');
        await userEvent.type(screen.getByPlaceholderText(/message recipients will see/i), 'Hello everyone');
        await userEvent.click(screen.getByRole('button', { name: /Review & Send/i }));
        // Confirm modal appears; nothing sent yet.
        expect(await screen.findByText('Send broadcast now?')).toBeInTheDocument();
        expect(createBroadcast).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Send Now' }));
        await waitFor(() => expect(createBroadcast).toHaveBeenCalled());
        const payload = (createBroadcast as any).mock.calls[0][0];
        expect(payload).toMatchObject({ title: 'Promo', subject: 'Subject', send_email: true, scheduled_at: null });
    });

    it('renders nested per-channel delivery_stats without [object Object]', async () => {
        (getBroadcast as any).mockResolvedValue({
            ...CREATED,
            status: 'SENT',
            delivery_stats: { EMAIL: { sent: 22, failed: 0 }, IN_APP: { sent: 22, pending: 1 } },
        });
        render(<Broadcasts />);
        await userEvent.click(await screen.findByText('June update'));
        await screen.findByText('Delivery');
        expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
        expect(screen.getAllByText(/sent:/i).length).toBeGreaterThanOrEqual(2); // one per channel
        expect(screen.getAllByText('22').length).toBeGreaterThan(0);
    });

    it('lands on the detail view after creating, and can send a test', async () => {
        render(<Broadcasts />);
        await userEvent.click(await screen.findByRole('button', { name: /New Broadcast/i }));
        await screen.findByText('New Broadcast');
        await userEvent.type(screen.getByPlaceholderText(/June feature announcement/i), 'Promo');
        await userEvent.type(screen.getByPlaceholderText(/New events are live/i), 'Subject');
        await userEvent.type(screen.getByPlaceholderText(/message recipients will see/i), 'Hello');
        await userEvent.click(screen.getByRole('button', { name: /Review & Send/i }));
        await userEvent.click(await screen.findByRole('button', { name: 'Send Now' }));
        // Detail view of the created broadcast.
        expect(await screen.findByText('Send Test to Me')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /Send Test to Me/i }));
        await waitFor(() => expect(sendBroadcastTest).toHaveBeenCalledWith('b-9'));
    });
});
