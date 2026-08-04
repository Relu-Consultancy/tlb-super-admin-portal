import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { cn } from '../../../shared/lib/utils';
import { VERTICAL_CONFIG } from '../../../shared/nav/verticals';
import type { ListingVertical } from '../../../shared/nav/sections';
import {
    listPartners,
    listTickets,
    ticketStatusLabel,
    ticketStatusTone,
    ticketCategoryLabel,
    ApiError,
    type SupportTicket,
} from '../../../shared/lib/api';

interface SupportTabProps {
    vertical: ListingVertical;
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return iso;
    }
}

/**
 * Support tickets have no vertical/listing-type field, so scoping is approximated by
 * cross-referencing `shared_with_partner_id` against this vertical's partner set.
 * Tickets never shared with a partner (raised directly by a customer) can't be
 * attributed to a vertical with the current data model and are excluded.
 */
const SupportTab = ({ vertical }: SupportTabProps) => {
    const category = VERTICAL_CONFIG[vertical].category;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [unscopedCount, setUnscopedCount] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [partners, allTickets] = await Promise.all([listPartners({ category }), listTickets()]);
            const partnerIds = new Set(partners.map((p) => p.id));
            const scoped = allTickets.filter((t) => t.shared_with_partner_id && partnerIds.has(t.shared_with_partner_id));
            setTickets(scoped);
            setUnscopedCount(allTickets.length - scoped.length);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load support tickets.');
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        load();
    }, [load]);

    const open = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed');
    const resolved = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed');

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>;
    }
    if (error) {
        return (
            <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-red-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
        );
    }

    const Table = ({ rows }: { rows: SupportTicket[] }) => (
        <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 ? (
                            <tr><td colSpan={5}><EmptyState title="Nothing here" description="No tickets in this list." /></td></tr>
                        ) : (
                            rows.map((t) => {
                                const tone = ticketStatusTone(t.status);
                                return (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-800">{t.subject}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{t.shared_with_partner_name || '—'}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{ticketCategoryLabel(t.category)}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn('px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', tone.bg, tone.color)}>
                                                {ticketStatusLabel(t.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatDate(t.created_at)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                <Info size={15} className="shrink-0 mt-0.5" />
                <span>
                    Support tickets aren't tagged with a vertical, so this list shows tickets shared with a{' '}
                    {VERTICAL_CONFIG[vertical].label.toLowerCase()} partner. {unscopedCount > 0 && `${unscopedCount} other ticket${unscopedCount === 1 ? '' : 's'} raised directly by customers can't be attributed to a vertical and ${unscopedCount === 1 ? 'is' : 'are'} not shown here.`}
                </span>
            </div>

            <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3">Open queries</h2>
                <Table rows={open} />
            </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3">Resolved queries</h2>
                <Table rows={resolved} />
            </div>
        </div>
    );
};

export default SupportTab;
