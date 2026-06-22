import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { get: vi.fn(() => Promise.resolve({})), post: vi.fn(() => Promise.resolve({})) },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
    listTransactions,
    getTransaction,
    registerPayment,
    queueTransactionExport,
    getTransactionExportJob,
    getFinanceSummary,
    getFinanceDashboard,
    queueSummaryExport,
    getSummaryExportJob,
    sourceLabel,
    sourceTone,
    paymentModeLabel,
    bookingTypeLabel,
    PAYMENT_MODES,
} from './finance';

describe('finance service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('lists transactions with filters/pagination', async () => {
        (api.get as any).mockResolvedValue({ count: 0, results: [] });
        await listTransactions({ period: 'this_month', source: 'manual', page: 2, page_size: 20 });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/finance/transactions/', {
            params: { period: 'this_month', source: 'manual', page: 2, page_size: 20 },
        });
    });

    it('gets a transaction detail', async () => {
        await getTransaction('t1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/finance/transactions/t1/');
    });

    it('registers a manual payment with the body', async () => {
        const input = { booking_id: 'b1', amount: '500.00', payment_mode: 'cash', external_reference: 'UTR-1' };
        await registerPayment(input);
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/finance/transactions/register/', input);
    });

    it('queues + polls the CSV export', async () => {
        await queueTransactionExport({ source: 'online' });
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/finance/transactions/export/', { source: 'online' });
        await getTransactionExportJob('job1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/finance/transactions/export/job1/');
    });

    it('fetches the finance summary + dashboard with the period', async () => {
        await getFinanceSummary({ period: 'this_month' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/finance/summary/', { params: { period: 'this_month' } });
        await getFinanceDashboard({ period: 'today' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/finance/dashboard/', { params: { period: 'today' } });
    });

    it('queues + polls the revenue summary export', async () => {
        await queueSummaryExport({ period: 'this_week' });
        expect(api.post).toHaveBeenCalledWith('/api/v1/admin/finance/summary/export/', { period: 'this_week' });
        await getSummaryExportJob('job-1');
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/finance/summary/export/job-1/');
    });

    it('formats sources, modes, and booking types', () => {
        expect(sourceLabel('online')).toBe('Online');
        expect(sourceLabel('manual')).toBe('Manual');
        expect(sourceTone('online')).toContain('blue');
        expect(sourceTone('manual')).toContain('purple');
        expect(paymentModeLabel('bank_transfer')).toBe('Bank Transfer');
        expect(paymentModeLabel(null)).toBe('—');
        expect(bookingTypeLabel('event')).toBe('Event');
        expect(PAYMENT_MODES.map((m) => m.value)).toContain('upi');
    });
});
