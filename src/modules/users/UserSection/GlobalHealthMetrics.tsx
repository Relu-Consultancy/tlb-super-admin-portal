import { useEffect, useState } from 'react';
import { Users, TrendingUp, UserMinus, Megaphone } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';
import { getUserMetrics, type UserMetrics } from '../../../shared/lib/api';

const GlobalHealthMetrics = ({ onBroadcast }: { onBroadcast?: () => void }) => {
    const [metrics, setMetrics] = useState<UserMetrics | null>(null);

    useEffect(() => {
        getUserMetrics().then(setMetrics).catch(() => {});
    }, []);

    const n = (v: number | undefined) => (v === undefined ? '—' : v.toLocaleString());

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">ZONE 1: Global Health Metrics & Mass Broadcast Engine</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded-full">+{n(metrics?.new_this_week)} / wk</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{n(metrics?.active_users)}</h3>
                        <p className="text-sm font-medium text-gray-500">Active Users</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">New today:</span> {n(metrics?.new_today)}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-gray-700">New this month:</span> {n(metrics?.new_this_month)}</p>
                    </div>
                </Card>

                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">All time</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{n(metrics?.total_users)}</h3>
                        <p className="text-sm font-medium text-gray-500">Total Registered Users</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">OTP:</span> {n(metrics?.by_auth_provider?.otp)}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-gray-700">Google:</span> {n(metrics?.by_auth_provider?.google)}</p>
                    </div>
                </Card>

                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl"><UserMinus size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded-full">Inactive</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{n(metrics?.inactive_users)}</h3>
                        <p className="text-sm font-medium text-gray-500">Inactive Accounts</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Deleted:</span> {n(metrics?.deleted_users)}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-gray-700">Total:</span> {n(metrics?.total_users)}</p>
                    </div>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl px-4 py-3">
                    <Megaphone size={16} className="shrink-0 mt-0.5" />
                    <span>Send mass email / in-app notifications to users and partners from the Broadcasts screen.</span>
                </div>
                <button
                    onClick={onBroadcast}
                    disabled={!onBroadcast}
                    className="flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl shadow-lg shadow-yellow-400/20 hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Megaphone size={16} /> New Broadcast
                </button>
            </div>
        </section>
    );
};

export default GlobalHealthMetrics;
