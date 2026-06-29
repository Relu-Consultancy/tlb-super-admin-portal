import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsFinance from './PaymentsFinance';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, { get(_: any, tag: string) {
            if (!cache[tag]) cache[tag] = ({ children, ...p }: any) => { const { initial, animate, exit, transition, layoutId, ...rest } = p; return React.createElement(tag as any, rest, children); };
            return cache[tag];
        } }),
        AnimatePresence: ({ children }: any) => children,
    };
});

const { authState } = vi.hoisted(() => ({ authState: { view: true, record: true, exportPerm: true } }));
vi.mock('../../shared/auth/AuthContext', () => ({
    useAuth: () => ({ hasPermission: (p: string) => (p === 'VIEW_TRANSACTIONS' ? authState.view : p === 'RECORD_PAYMENTS' ? authState.record : p === 'EXPORT_REPORTS' ? authState.exportPerm : false) }),
}));

vi.mock('../../shared/lib/api', () => ({
    listTransactions: vi.fn(),
    getTransaction: vi.fn(),
    registerPayment: vi.fn(() => Promise.resolve({})),
    queueTransactionExport: vi.fn(),
    getTransactionExportJob: vi.fn(),
    downloadTransactionExport: vi.fn(),
    sourceLabel: (s: string) => (s === 'online' ? 'Online' : 'Manual'),
    sourceTone: () => 'bg-blue-50 text-blue-600',
    paymentModeLabel: (m: string) => m ?? '—',
    bookingTypeLabel: (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'),
    parseAmount: (v: any) => (v == null || v === '' ? null : Number(v)),
    formatMoney: (n: any) => `₹${Number(n).toLocaleString()}`,
    PAYMENT_MODES: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }],
    TRANSACTION_SOURCES: ['online', 'manual'],
    BOOKING_TYPES: ['event', 'venue', 'program', 'class'],
    FINANCE_PERIODS: ['today', 'this_week', 'this_month', 'custom'],
    FINANCE_PERIOD_LABELS: { today: 'Today', this_week: 'This Week', this_month: 'This Month', custom: 'Custom' },
    ApiError: class ApiError extends Error { code: string | null = null; },
}));
import { listTransactions, getTransaction, registerPayment } from '../../shared/lib/api';

const PAGE = {
    count: 1, page: 1, page_size: 20, next: null, previous: null,
    results: [
        { transaction_id: 'tx-12345678', transaction_type: 'manual_payment', source: 'manual', status: 'success', amount: '500.00', currency: 'INR', customer_email: 'rahul@x.com', partner_name: 'Skyline', booking_reference: 'TLB-EV-1', booking_type: 'event', payment_mode: 'cash', payment_method: 'unknown', external_reference: 'UTR-1', date: '2026-06-05T11:00:00Z' },
    ],
};
const DETAIL = { transaction_id: 'tx-12345678', transaction_type: 'manual_payment', source: 'manual', status: 'success', amount: '500.00', currency: 'INR', payment_mode: 'cash', external_reference: 'UTR-1', notes: 'Paid at desk', razorpay_order_id: null, razorpay_payment_id: null, booking: { id: 'b1', booking_reference: 'TLB-EV-1', booking_type: 'event', status: 'confirmed', listing_title: 'Comedy Night', original_amount: '600.00', discount_amount: '100.00', platform_fee: '50.00', total_amount: '500.00' }, customer: { email: 'rahul@x.com', name: 'Rahul' }, partner: { name: 'Skyline' }, payment_detail: null, registered_by: { id: 'a1', email: 'fin@x.com' }, created_at: '2026-06-05T11:00:00Z' };

describe('PaymentsFinance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authState.view = true; authState.record = true; authState.exportPerm = true;
        (listTransactions as any).mockResolvedValue(PAGE);
        (getTransaction as any).mockResolvedValue(DETAIL);
    });

    it('renders the tabs and loads transactions', async () => {
        render(<PaymentsFinance />);
        expect(screen.getByText('Payments & Finance')).toBeInTheDocument();
        expect(screen.getByText('Transactions')).toBeInTheDocument();
        expect(await screen.findByText('rahul@x.com')).toBeInTheDocument();
        await waitFor(() => expect(listTransactions).toHaveBeenCalled());
    });

    it('blocks access without VIEW_TRANSACTIONS', async () => {
        authState.view = false;
        render(<PaymentsFinance />);
        expect(await screen.findByText('No access')).toBeInTheDocument();
        expect(listTransactions).not.toHaveBeenCalled();
    });

    it('opens the transaction detail slide-over', async () => {
        render(<PaymentsFinance />);
        await userEvent.click(await screen.findByText('rahul@x.com'));
        await waitFor(() => expect(getTransaction).toHaveBeenCalledWith('tx-12345678'));
        expect(await screen.findByText('Comedy Night')).toBeInTheDocument();
    });

    it('shows the Register button only with RECORD_PAYMENTS', async () => {
        authState.record = false;
        render(<PaymentsFinance />);
        await screen.findByText('rahul@x.com');
        expect(screen.queryByRole('button', { name: /Register/i })).not.toBeInTheDocument();
    });

    it('registers a manual payment', async () => {
        render(<PaymentsFinance />);
        await screen.findByText('rahul@x.com');
        await userEvent.click(screen.getByRole('button', { name: /^Register$/i }));
        await userEvent.type(screen.getByPlaceholderText(/UUID of the booking/i), 'b1');
        await userEvent.type(screen.getByPlaceholderText('500.00'), '500.00');
        await userEvent.click(screen.getByRole('button', { name: /Register Payment/i }));
        await waitFor(() => expect(registerPayment).toHaveBeenCalledWith(expect.objectContaining({ booking_id: 'b1', payment_mode: 'cash' })));
        expect((registerPayment as any).mock.calls[0][0].amount).toBeTruthy();
    });

    it('shows a coming-soon state for the Payouts tab', async () => {
        render(<PaymentsFinance />);
        await screen.findByText('rahul@x.com');
        await userEvent.click(screen.getByText('Payouts'));
        expect(await screen.findByText(/Payouts coming soon/i)).toBeInTheDocument();
    });
});
