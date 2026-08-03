import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STANDARD_PERIODS, STANDARD_PERIOD_LABELS, type StandardPeriod } from '../../lib/period';

interface PeriodFilterProps {
    value: StandardPeriod;
    onChange: (p: StandardPeriod) => void;
    /** Current custom-range dates (only used when value === 'custom'). */
    dateFrom?: string;
    dateTo?: string;
    /** Called with the new (from, to) when either custom date input changes. */
    onDateChange?: (from: string, to: string) => void;
    /** Override which periods to show (defaults to the full standard set). */
    periods?: readonly StandardPeriod[];
    className?: string;
}

/**
 * The standard business date-filter control (Terminology Guide v1.0):
 * As of Today · Last 7 Days · Last 30 Days · This Month · Custom Range.
 * Shared across the Dashboard, Reports and Directory screens so every surface
 * offers the exact same filters. Pair with `resolvePeriodParams()` when fetching.
 */
const PeriodFilter = ({
    value,
    onChange,
    dateFrom = '',
    dateTo = '',
    onDateChange,
    periods = STANDARD_PERIODS,
    className,
}: PeriodFilterProps) => (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <div className="flex flex-wrap bg-gray-100 rounded-xl p-1">
            {periods.map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={cn(
                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap',
                        value === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                    )}
                >
                    {STANDARD_PERIOD_LABELS[p]}
                </button>
            ))}
        </div>
        {value === 'custom' && onDateChange && (
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <input
                    type="date"
                    aria-label="From date"
                    value={dateFrom}
                    onChange={(e) => onDateChange(e.target.value, dateTo)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                    type="date"
                    aria-label="To date"
                    value={dateTo}
                    onChange={(e) => onDateChange(dateFrom, e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm"
                />
            </div>
        )}
    </div>
);

export default PeriodFilter;
