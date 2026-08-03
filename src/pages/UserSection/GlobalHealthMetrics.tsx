import { Users, TrendingUp, UserMinus } from 'lucide-react';
import Card from '../../components/ui/Card';
import { USER_SECTION_METRICS as metrics } from '../../mockData';

const GlobalHealthMetrics = () => {
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">ZONE 1: Global Health Metrics & Mass Broadcast Engine</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded-full">{metrics.activeTicketBuyers.growth}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics.activeTicketBuyers.value}</h3>
                        <p className="text-sm font-medium text-gray-500">Active Ticket Buyers</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Location:</span> {metrics.activeTicketBuyers.location}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-gray-700">Insight:</span> {metrics.activeTicketBuyers.insight}</p>
                    </div>
                </Card>

                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{metrics.activeInquirers.growth}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics.activeInquirers.value}</h3>
                        <p className="text-sm font-medium text-gray-500">Active Platform Inquirers</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Location:</span> {metrics.activeInquirers.location}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-gray-700">Insight:</span> {metrics.activeInquirers.insight}</p>
                    </div>
                </Card>

                <Card className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl"><UserMinus size={24} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded-full">{metrics.dormantAccounts.growth}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics.dormantAccounts.value}</h3>
                        <p className="text-sm font-medium text-gray-500">Dormant Accounts</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Location:</span> {metrics.dormantAccounts.location}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-gray-700">Insight:</span> {metrics.dormantAccounts.insight}</p>
                    </div>
                </Card>
            </div>
            <div className="flex justify-end">
                <button className="px-6 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors">
                    Broadcast Message to Cohort
                </button>
            </div>
        </section>
    );
};

export default GlobalHealthMetrics;
