import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { resolvePeriodParams, type StandardPeriod } from '../../../shared/lib/period';
import type { ListingVertical } from '../../../shared/nav/sections';
import { formatMoney, bookingTypeLabel, ApiError, type TransactionListItem } from '../../../shared/lib/api';
import { fetchAllTransactions, sumAmount, uniqueCustomerCount } from './txAggregate';

interface TicketingTabProps {
    vertical: ListingVertical;
    period: StandardPeriod;
    dateFrom: string;
    dateTo: string;
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return iso;
    }
}

const TicketingTab = ({ vertical, period, dateFrom, dateTo }: TicketingTabProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<TransactionListItem[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRows(await fetchAllTransactions({ booking_type: vertical, ...resolvePeriodParams(period, dateFrom, dateTo) }));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load ticketing data.');
        } finally {
            setLoading(false);
        }
    }, [vertical, period, dateFrom, dateTo]);

    useEffect(() => {
        load();
    }, [load]);

    const tiles = [
        { label: 'Tickets sold (period)', value: rows.length },
        { label: 'Unique buyers', value: uniqueCustomerCount(rows) },
        { label: 'Ticket revenue', value: formatMoney(sumAmount(rows)) },
    ];

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-500">
                Every ticket/booking purchase on this vertical for the selected period — tap Financials for the revenue view.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tiles.map((t) => (
                    <Card key={t.label}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{t.value}</p>
                    </Card>
                ))}
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Ref</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5}><div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="animate-spin" size={24} /></div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={5}><div className="flex items-start gap-2 text-sm px-6 py-4 text-red-700"><AlertCircle size={16} /> {error}</div></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={5}><EmptyState title="No ticket transactions" description="No transactions match this period." /></td></tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.transaction_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700">{r.customer_email || '—'}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{r.booking_reference || '—'}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{bookingTypeLabel(r.booking_type)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatMoney(r.amount, r.currency)}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatDate(r.date)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TicketingTab;
