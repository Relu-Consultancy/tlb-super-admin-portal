import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { resolvePeriodParams, type StandardPeriod } from '../../../shared/lib/period';
import type { ListingVertical } from '../../../shared/nav/sections';
import { formatMoney, bookingTypeLabel, ApiError, type TransactionListItem } from '../../../shared/lib/api';
import { fetchAllTransactions, sumAmount } from './txAggregate';

interface FinancialsTabProps {
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

const FinancialsTab = ({ vertical, period, dateFrom, dateTo }: FinancialsTabProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<TransactionListItem[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRows(await fetchAllTransactions({ booking_type: vertical, ...resolvePeriodParams(period, dateFrom, dateTo) }));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load financials.');
        } finally {
            setLoading(false);
        }
    }, [vertical, period, dateFrom, dateTo]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm font-bold text-gray-900">Financials</h2>
                <p className="text-sm text-gray-500 mt-1">Ticket revenue collected for this vertical, selected period.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket revenue collected</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '—' : formatMoney(sumAmount(rows))}</p>
                </Card>
                <Card>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '—' : rows.length}</p>
                </Card>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                <Info size={15} className="shrink-0 mt-0.5" />
                <span>Commission earned, TLB platform fee, and payout-pending breakdowns need backend support that doesn't exist for this vertical yet — not shown here to avoid guessing at numbers.</span>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Ref</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</th>
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
                                <tr><td colSpan={5}><EmptyState title="No revenue in this period" description="No transactions match this period." /></td></tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.transaction_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{r.booking_reference || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{r.partner_name || '—'}</td>
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

export default FinancialsTab;
