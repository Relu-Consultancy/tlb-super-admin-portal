import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
    api: { get: vi.fn(() => Promise.resolve({})) },
    ApiError: class ApiError extends Error {},
}));
import { api } from './client';
import {
    getOverviewStats,
    getCustomerStats,
    getPartnerStats,
    parseAmount,
    safeCurrency,
    STATS_PERIODS,
    STATS_PERIOD_LABELS,
} from './stats';

describe('stats service', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches overview/customers/partners at the right paths with period params', async () => {
        await getOverviewStats({ period: 'this_month' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/stats/overview/', { params: { period: 'this_month', date_from: undefined, date_to: undefined } });

        await getCustomerStats({ period: 'custom', date_from: '2026-06-01', date_to: '2026-06-30' });
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/stats/customers/', { params: { period: 'custom', date_from: '2026-06-01', date_to: '2026-06-30' } });

        await getPartnerStats();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/stats/partners/', { params: undefined });
    });

    it('parseAmount handles strings, garbage, and nullish', () => {
        expect(parseAmount('1234.50')).toBe(1234.5);
        expect(parseAmount('57584.')).toBe(57584);
        expect(parseAmount('-9.21')).toBe(-9.21);
        expect(parseAmount('-')).toBeNull();
        expect(parseAmount('')).toBeNull();
        expect(parseAmount(null)).toBeNull();
        expect(parseAmount('abc')).toBeNull();
        expect(parseAmount(42)).toBe(42);
    });

    it('safeCurrency only accepts real 3-letter codes, else defaults INR', () => {
        expect(safeCurrency('USD')).toBe('USD');
        expect(safeCurrency('inr')).toBe('INR');
        expect(safeCurrency('string')).toBe('INR');
        expect(safeCurrency('')).toBe('INR');
        expect(safeCurrency(null)).toBe('INR');
    });

    it('exposes the period presets and labels', () => {
        expect(STATS_PERIODS).toContain('this_month');
        expect(STATS_PERIODS).toContain('custom');
        expect(STATS_PERIOD_LABELS.this_week).toBe('This Week');
    });
});
