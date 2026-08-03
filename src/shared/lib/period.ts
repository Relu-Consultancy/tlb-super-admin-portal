/**
 * Standard business date filters — TLB Terminology Guide v1.0.
 *
 * The guide defines five filters:
 *   As of Today  · 12:00 AM until current time today
 *   Last 7 Days  · rolling last 7 calendar days
 *   Last 30 Days · rolling last 30 calendar days
 *   This Month   · 1st of the current month until today
 *   Custom Range · user-selected dates
 *
 * The backend only exposes `today | yesterday | this_week | last_week |
 * this_month | custom (+date_from/date_to)` — it has NO rolling 7/30-day
 * preset. `resolvePeriodParams()` bridges the two: `today`/`this_month` map
 * straight through, and the rolling windows are sent as a `custom` range whose
 * dates are computed client-side (inclusive of today). Every period returns
 * real data.
 */

export const STANDARD_PERIODS = ['today', 'last_7_days', 'last_30_days', 'this_month', 'custom'] as const;
export type StandardPeriod = (typeof STANDARD_PERIODS)[number];

/** Periods without the free "Custom Range" (e.g. a dropdown that also offers "Any period"). */
export const STANDARD_PRESET_PERIODS = ['today', 'last_7_days', 'last_30_days', 'this_month'] as const;

export const STANDARD_PERIOD_LABELS: Record<StandardPeriod, string> = {
  today: 'As of Today',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  this_month: 'This Month',
  custom: 'Custom Range',
};

export interface ResolvedPeriodParams {
  period: string;
  date_from?: string;
  date_to?: string;
}

/** Format a Date as `YYYY-MM-DD` (local time). */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** A rolling window of the last `days` calendar days, inclusive of today. */
function rollingWindow(days: number): ResolvedPeriodParams {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { period: 'custom', date_from: ymd(from), date_to: ymd(to) };
}

/**
 * Translate a standard business filter into the backend `period` /
 * `date_from` / `date_to` parameters. Rolling 7/30-day windows become a
 * client-computed `custom` range since the backend lacks those presets.
 */
export function resolvePeriodParams(
  period: StandardPeriod,
  dateFrom?: string,
  dateTo?: string,
): ResolvedPeriodParams {
  switch (period) {
    case 'today':
      return { period: 'today' };
    case 'this_month':
      return { period: 'this_month' };
    case 'last_7_days':
      return rollingWindow(7);
    case 'last_30_days':
      return rollingWindow(30);
    case 'custom':
      return { period: 'custom', date_from: dateFrom || undefined, date_to: dateTo || undefined };
  }
}

/**
 * Resolve a standard filter to an explicit `{date_from, date_to}` range, for
 * endpoints that take only dates (no `period` preset) — e.g. `getUserMetrics`.
 * "As of Today" is today→today; "This Month" is the 1st→today.
 */
export function resolvePeriodRange(
  period: StandardPeriod,
  dateFrom?: string,
  dateTo?: string,
): { date_from?: string; date_to?: string } {
  const today = new Date();
  switch (period) {
    case 'today':
      return { date_from: ymd(today), date_to: ymd(today) };
    case 'last_7_days': {
      const { date_from, date_to } = rollingWindow(7);
      return { date_from, date_to };
    }
    case 'last_30_days': {
      const { date_from, date_to } = rollingWindow(30);
      return { date_from, date_to };
    }
    case 'this_month':
      return { date_from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), date_to: ymd(today) };
    case 'custom':
      return { date_from: dateFrom || undefined, date_to: dateTo || undefined };
  }
}
