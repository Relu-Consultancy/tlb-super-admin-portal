import {
    Users,
    CreditCard,
    Ticket,
    MessageSquare,
    ChevronRight,
    Download,
    Calendar,
    CheckCircle,
    UserCog,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import StatCard from '../../shared/components/ui/StatCard';
import { Screen } from '../../types';

// Empty defaults until the dashboard stats API is wired.
const STATS = {
    today: { bookings: 0, revenue: 0, newUsers: 0, activeEvents: 0 },
    allTime: { totalUsers: 0, totalPartners: 0, totalEvents: 0, totalRevenue: 0, platformCommission: 0 },
};

const Dashboard = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <p className="text-gray-500 text-sm">Good Morning,</p>
                    <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </header>

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Today's Overview</h2>
                    <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Live Updates
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Bookings" value={STATS.today.bookings} trend="0%" icon={Ticket} />
                    <StatCard title="Revenue" value={`$${(STATS.today.revenue / 1000).toFixed(1)}k`} trend="0%" icon={CreditCard} />
                    <StatCard title="New Users" value={`+${STATS.today.newUsers}`} trend="0%" icon={Users} />
                    <StatCard title="Active Events" value={STATS.today.activeEvents} trend="0%" icon={Calendar} />
                </div>
            </section>

            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">All-time Statistics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Card className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{STATS.allTime.totalUsers.toLocaleString()}</h3>
                                <p className="text-gray-500 text-sm">Total Active Users</p>
                            </div>
                        </Card>
                        <Card className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><CreditCard size={24} /></div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{STATS.allTime.totalPartners}</h3>
                                <p className="text-gray-500 text-sm">Verified Partners</p>
                            </div>
                        </Card>
                        <Card className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Calendar size={24} /></div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{STATS.allTime.totalEvents.toLocaleString()}</h3>
                                <p className="text-gray-500 text-sm">Events Hosted</p>
                            </div>
                        </Card>
                        <Card className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CreditCard size={24} /></div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">${(STATS.allTime.totalRevenue / 1000000).toFixed(2)}M</h3>
                                <p className="text-gray-500 text-sm">Gross Merchandise Volume</p>
                            </div>
                        </Card>
                        <Card className="flex items-center justify-between bg-yellow-50 border-yellow-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-400 text-gray-900 rounded-xl font-bold">%</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">${STATS.allTime.platformCommission.toLocaleString()}</h3>
                                    <p className="text-gray-500 text-sm">Total Platform Commissions Earned</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </Card>
                    </div>

                    <Card className="flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-6">Quick Actions</h3>
                        <div className="space-y-3 flex-1">
                            {[
                                { label: 'Approve Partners', sub: 'Review pending requests', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', screen: Screen.PARTNER_MANAGEMENT },
                                { label: 'Approve Events', sub: 'Review waiting events', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', screen: Screen.EVENT_APPROVAL },
                                { label: 'Team Management', sub: 'Add or edit admins', icon: UserCog, color: 'text-orange-500', bg: 'bg-orange-50', screen: Screen.ADMIN_MANAGEMENT },
                                { label: 'Open Tickets', sub: 'View support tickets', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', screen: Screen.SUPPORT_SYSTEM },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => setScreen(action.screen)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${action.bg} ${action.color}`}>
                                            <action.icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900 text-sm">{action.label}</p>
                                            <p className="text-xs text-gray-500">{action.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="bg-slate-900 rounded-2xl p-5 text-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm">System Status</h4>
                                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Healthy</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-slate-400">Server Load</span>
                                            <span className="text-slate-200">—</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400 rounded-full" style={{ width: '0%' }} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">API Latency</span>
                                        <span className="text-xs font-mono text-slate-200">—</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
