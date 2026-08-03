import { describe, it, expect } from 'vitest';
import {
    STANDARD_PERIODS,
    STANDARD_PERIOD_LABELS,
    resolvePeriodParams,
    resolvePeriodRange,
} from './period';

const daysBetween = (from: string, to: string) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

describe('period — standard filters', () => {
    it('exposes the guide labels', () => {
        expect(STANDARD_PERIODS).toEqual(['today', 'last_7_days', 'last_30_days', 'this_month', 'custom']);
        expect(STANDARD_PERIOD_LABELS.today).toBe('As of Today');
        expect(STANDARD_PERIOD_LABELS.last_7_days).toBe('Last 7 Days');
        expect(STANDARD_PERIOD_LABELS.last_30_days).toBe('Last 30 Days');
        expect(STANDARD_PERIOD_LABELS.this_month).toBe('This Month');
        expect(STANDARD_PERIOD_LABELS.custom).toBe('Custom Range');
    });
});

describe('resolvePeriodParams', () => {
    it('maps today/this_month to backend presets (no dates)', () => {
        expect(resolvePeriodParams('today')).toEqual({ period: 'today' });
        expect(resolvePeriodParams('this_month')).toEqual({ period: 'this_month' });
    });

    it('sends rolling windows as a custom range spanning the right number of days', () => {
        const w7 = resolvePeriodParams('last_7_days');
        expect(w7.period).toBe('custom');
        expect(daysBetween(w7.date_from!, w7.date_to!)).toBe(6); // inclusive of today → 6-day span

        const w30 = resolvePeriodParams('last_30_days');
        expect(w30.period).toBe('custom');
        expect(daysBetween(w30.date_from!, w30.date_to!)).toBe(29);
    });

    it('passes custom dates through verbatim', () => {
        expect(resolvePeriodParams('custom', '2026-01-01', '2026-01-31')).toEqual({
            period: 'custom',
            date_from: '2026-01-01',
            date_to: '2026-01-31',
        });
    });
});

describe('resolvePeriodRange', () => {
    it('returns explicit date_from/date_to for every preset', () => {
        const today = resolvePeriodRange('today');
        expect(today.date_from).toBe(today.date_to); // single day

        const month = resolvePeriodRange('this_month');
        expect(month.date_from).toMatch(/-01$/); // first of the month

        const w7 = resolvePeriodRange('last_7_days');
        expect(daysBetween(w7.date_from!, w7.date_to!)).toBe(6);
    });
});
