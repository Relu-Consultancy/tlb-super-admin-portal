import { useEffect, useState, useCallback } from 'react';
import {
    Wallet,
    TrendingUp,
    RotateCcw,
    Percent,
    Loader2,
    AlertCircle,
    CalendarCheck,
    Banknote,
    Receipt,
    Download,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import Card from '../../shared/components/ui/Card';
import StatCard from '../../shared/components/ui/StatCard';
import EmptyState from '../../shared/components/ui/EmptyState';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/auth/AuthContext';
import {
    getFinanceSummary,
    getFinanceDashboard,
    queueSummaryExport,
    getSummaryExportJob,
    downloadSummaryExport,
    parseAmount,
    safeCurrency,
    formatMoney,
    FINANCE_PERIODS,
    FINANCE_PERIOD_LABELS,
    ApiError,
    type FinanceSummary,
    type FinanceDashboardData,
    type FinanceParams,
    type FinancePeriod,
} from '../../shared/lib/api';

/** Safely format an integer-ish value that may arrive as a number, string, or be missing. */
function count(v: unknown): string {
    return (Number(v) || 0).toLocaleString();
}

function formatDateShort(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

interface BreakdownRow { label: string; amount: number; count?: number }

/** The dashboard endpoint's shape isn't pinned — normalize a breakdown (array OR object-map) into rows. */
function toBreakdownRows(v: unknown): BreakdownRow[] {
    if (!v) return [];
    const labelOf = (o: Record<string, unknown>) =>
        String(o.label ?? o.key ?? o.name ?? o.source ?? o.payment_mode ?? o.booking_type ?? o.payment_method ?? '—');
    const amountOf = (o: Record<string, unknown>) =>
        parseAmount((o.amount ?? o.total ?? o.gross ?? o.value) as string) ?? 0;
    if (Array.isArray(v)) {
        return v.map((it) => {
            const o = (it ?? {}) as Record<string, unknown>;
            return { label: labelOf(o), amount: amountOf(o), count: typeof o.count === 'number' ? o.count : undefined };
        });
    }
    if (typeof v === 'object') {
        return Object.entries(v as Record<string, unknown>).map(([key, val]) => {
            if (val && typeof val === 'object') {
                const o = val as Record<string, unknown>;
                return { label: key, amount: amountOf(o), count: typeof o.count === 'number' ? o.count : undefined };
            }
            return { label: key, amount: parseAmount(val as string) ?? 0 };
        });
    }
    return [];
}

/** Find the daily trend array on a loosely-typed dashboard payload. */
function pickTrend(dash: FinanceDashboardData | null): { name: string; gross: number; net: number; refunds: number }[] {
    if (!dash) return [];
    const raw = (dash.trend ?? (dash as Record<string, unknown>).daily ?? (dash as Record<string, unknown>).series) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        return {
            name: formatDateShort((o.date ?? o.day ?? o.label) as string),
            gross: parseAmount(o.gross as string) ?? 0,
            net: parseAmount((o.net ?? o.net_revenue) as string) ?? 0,
            refunds: parseAmount(o.refunds as string) ?? 0,
        };
    });
}

const FinanceDashboard = () => {
    const { hasPermission } = useAuth();
    const canView = hasPermission('VIEW_TRANSACTIONS') || hasPermission('VIEW_REVENUE');
    const canExport = hasPermission('EXPORT_REPORTS');

    const [period, setPeriod] = useState<FinancePeriod>('this_month');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [dash, setDash] = useState<FinanceDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportBanner, setExportBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const params = useCallback((): FinanceParams => (
        period === 'custom' ? { period, date_from: dateFrom, date_to: dateTo } : { period }
    ), [period, dateFrom, dateTo]);

    const load = useCallback(async () => {
        if (period === 'custom' && (!dateFrom || !dateTo)) return;
        setLoading(true);
        setError(null);
        try {
            const p = period === 'custom' ? { period, date_from: dateFrom, date_to: dateTo } : { period };
            // Summary is the documented source of truth for KPIs; the dashboard
            // (trend + breakdowns) is best-effort and must not break the KPIs.
            const [s, d] = await Promise.all([
                getFinanceSummary(p),
                getFinanceDashboard(p).catch(() => null),
            ]);
            setSummary(s);
            setDash(d);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load finance data.');
        } finally {
            setLoading(false);
        }
    }, [period, dateFrom, dateTo]);

    useEffect(() => { if (canView) load(); }, [canView, load]);

    const handleExport = async () => {
        setExporting(true);
        setExportBanner(null);
        const isDone = (s?: string) => /complet|success|done|ready|finish/i.test(s || '');
        const isFailed = (s?: string) => /fail|error|cancel/i.test(s || '');
        try {
            let job = await queueSummaryExport(params());
            for (let i = 0; i < 30 && !isDone(job.status) && !isFailed(job.status) && !job.error; i++) {
                await new Promise((r) => setTimeout(r, 2000));
                job = await getSummaryExportJob(job.job_id);
            }
            if (isFailed(job.status) || job.error) throw new Error(job.error || 'Export failed on the server.');
            if (!isDone(job.status)) throw new Error('Export is taking longer than expected — try again shortly.');
            const blob = await downloadSummaryExport(job.job_id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `revenue-summary-${period}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            setExportBanner({ kind: 'success', text: 'Revenue summary exported.' });
        } catch (err) {
            setExportBanner({ kind: 'error', text: err instanceof Error ? err.message : 'Export failed.' });
        } finally {
            setExporting(false);
        }
    };

    if (!canView) {
        return <EmptyState icon={AlertCircle} title="No access" description="You need the View Transactions or View Revenue permission to see finance figures." />;
    }

    const currency = safeCurrency(summary?.currency);
    const money = (v: string | number | null | undefined) => formatMoney(parseAmount(v) ?? 0, currency);
    const trend = pickTrend(dash);
    const bySource = toBreakdownRows(dash?.by_source);
    const byMode = toBreakdownRows(dash?.by_payment_mode);
    const byType = toBreakdownRows(dash?.by_booking_type);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
                    <p className="text-gray-500 text-sm">Revenue, refunds, commission &amp; payouts · {FINANCE_PERIOD_LABELS[period]}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {FINANCE_PERIODS.map((p) => (
                            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap', period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                                {FINANCE_PERIOD_LABELS[p]}
                            </button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
                            <span className="text-gray-400 text-sm">→</span>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
                        </div>
                    )}
                    {canExport && (
                        <button onClick={handleExport} disabled={exporting || !summary} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-60">
                            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export
                        </button>
                    )}
                </div>
            </header>

            {exportBanner && (
                <div className={cn('flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium', exportBanner.kind === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                    {exportBanner.kind === 'success' ? <Download size={16} /> : <AlertCircle size={16} />}
                    {exportBanner.text}
                </div>
            )}

            {error ? (
                <EmptyState icon={AlertCircle} title="Couldn't load finance data" description={error} />
            ) : loading && !summary ? (
                <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
            ) : !summary ? (
                <EmptyState icon={Wallet} title="Pick a date range" description="Choose a period to see finance figures." />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Gross Revenue" value={money(summary.gross)} icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
                        <StatCard title="Net Revenue" value={money(summary.net_revenue)} icon={Wallet} colorClass="bg-green-50 text-green-600" />
                        <StatCard title="Refunds" value={money(summary.refunds)} icon={RotateCcw} colorClass="bg-red-50 text-red-600" />
                        <StatCard title="Commission Earned" value={money(summary.commission_earned)} icon={Percent} colorClass="bg-purple-50 text-purple-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900">Revenue Trend</h3>
                                <span className="text-xs text-gray-400">{FINANCE_PERIOD_LABELS[period]}</span>
                            </div>
                            <div className="h-72">
                                {trend.length === 0 ? (
                                    <EmptyState title="No trend data for this period" className="h-full" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={70} tickFormatter={(v) => money(v)} />
                                            <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Area type="monotone" dataKey="gross" stroke="#3b82f6" strokeWidth={2} fill="url(#gGross)" name="Gross" />
                                            <Area type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} fill="url(#gNet)" name="Net" />
                                            <Area type="monotone" dataKey="refunds" stroke="#ef4444" strokeWidth={2} fill="none" name="Refunds" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>

                        <Card className="space-y-4">
                            <h3 className="font-bold text-gray-900">Summary</h3>
                            <Row label="Payout Liability" value={money(summary.payout_liability)} icon={Banknote} />
                            <Row label="Avg Transaction Value" value={money(summary.avg_transaction_value)} icon={Receipt} />
                            <Row label="Transactions" value={count(summary.transaction_count)} icon={CalendarCheck} />
                            <Row label="Refunds" value={count(summary.refund_count)} icon={RotateCcw} />
                            <div className="pt-3 border-t border-gray-200 text-[11px] text-gray-400">
                                Figures from the live finance ledger. Payouts &amp; reconciliation are managed on their own screens.
                            </div>
                        </Card>
                    </div>

                    {(bySource.length > 0 || byMode.length > 0 || byType.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Breakdown title="By Source" rows={bySource} money={money} />
                            <Breakdown title="By Payment Mode" rows={byMode} money={money} />
                            <Breakdown title="By Booking Type" rows={byType} money={money} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof CalendarCheck }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1.5">{Icon && <Icon size={14} className="text-gray-400" />} {label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
        </div>
    );
}

function Breakdown({ title, rows, money }: { title: string; rows: BreakdownRow[]; money: (v: number) => string }) {
    if (rows.length === 0) {
        return <Card><h3 className="font-bold text-gray-900 mb-3">{title}</h3><EmptyState title="No data" className="py-8" /></Card>;
    }
    const max = Math.max(...rows.map((r) => Math.abs(r.amount)), 1);
    return (
        <Card>
            <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-3">
                {rows.map((r) => (
                    <div key={r.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 capitalize">{r.label.replace(/_/g, ' ')}{typeof r.count === 'number' && <span className="text-gray-400"> · {r.count}</span>}</span>
                            <span className="font-bold text-gray-900">{money(r.amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.round((Math.abs(r.amount) / max) * 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default FinanceDashboard;
