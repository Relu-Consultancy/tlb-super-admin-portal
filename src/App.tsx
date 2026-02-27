import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  UserCog,
  CreditCard,
  PieChart,
  Ticket,
  MessageSquare,
  BarChart3,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Plus,
  Download,
  Filter,
  MoreVertical,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  X,
  Menu,
  Phone,
  Shield,
  Settings as SettingsIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import * as mock from './mockData';

// --- Types ---
enum Screen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PARTNER_MANAGEMENT = 'PARTNER_MANAGEMENT',
  EVENT_APPROVAL = 'EVENT_APPROVAL',
  ADMIN_MANAGEMENT = 'ADMIN_MANAGEMENT',
  PAYMENTS_FINANCE = 'PAYMENTS_FINANCE',
  FINANCE_DASHBOARD = 'FINANCE_DASHBOARD',
  COUPONS_MARKETING = 'COUPONS_MARKETING',
  SUPPORT_SYSTEM = 'SUPPORT_SYSTEM',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
}

// --- Components ---

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string;[key: string]: any }) => (
  <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm p-6", className)} {...props}>
    {children}
  </div>
);

const StatCard = ({ title, value, trend, icon: Icon, colorClass }: any) => (
  <Card className="flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-xl", colorClass || "bg-yellow-50 text-yellow-600")}>
        <Icon size={20} />
      </div>
      {trend && (
        <span className={cn("text-xs font-medium", trend.startsWith('+') ? "text-green-500" : "text-red-500")}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-2">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </Card>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
      active
        ? "bg-yellow-400 text-gray-900 font-semibold shadow-md shadow-yellow-400/20"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )}
  >
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </button>
);

// --- Screens ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="text-yellow-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TLB Admin Team</h1>
          <p className="text-gray-500 text-sm">Secure access for super admins</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@tlb-events.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
          >
            Login
          </button>

          <button type="button" className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Forgot Password?
          </button>
        </form>
      </motion.div>
      <p className="mt-8 text-gray-400 text-xs text-center">TLB Event Management Platform © 2024</p>
    </div>
  );
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
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 transition-colors shadow-sm">
            <Plus size={16} /> Create New
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
          <StatCard title="Bookings" value={mock.DASHBOARD_STATS.today.bookings} trend="+12%" icon={Ticket} />
          <StatCard title="Revenue" value={`$${(mock.DASHBOARD_STATS.today.revenue / 1000).toFixed(1)}k`} trend="+8%" icon={CreditCard} />
          <StatCard title="New Users" value={`+${mock.DASHBOARD_STATS.today.newUsers}`} trend="+5%" icon={Users} />
          <StatCard title="Active Events" value={mock.DASHBOARD_STATS.today.activeEvents} trend="0%" icon={Calendar} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">All-time Statistics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{mock.DASHBOARD_STATS.allTime.totalUsers.toLocaleString()}</h3>
                <p className="text-gray-500 text-sm">Total Active Users</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><PieChart size={24} /></div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{mock.DASHBOARD_STATS.allTime.totalPartners}</h3>
                <p className="text-gray-500 text-sm">Verified Partners</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Calendar size={24} /></div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{mock.DASHBOARD_STATS.allTime.totalEvents.toLocaleString()}</h3>
                <p className="text-gray-500 text-sm">Events Hosted</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CreditCard size={24} /></div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">${(mock.DASHBOARD_STATS.allTime.totalRevenue / 1000000).toFixed(2)}M</h3>
                <p className="text-gray-500 text-sm">Gross Merchandise Volume</p>
              </div>
            </Card>
            <Card className="flex items-center justify-between bg-yellow-50 border-yellow-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-400 text-gray-900 rounded-xl font-bold">%</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">${mock.DASHBOARD_STATS.allTime.platformCommission.toLocaleString()}</h3>
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
                { label: 'Approve Partners', sub: '3 pending requests', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', screen: Screen.PARTNER_MANAGEMENT },
                { label: 'Approve Events', sub: '12 events waiting', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', screen: Screen.EVENT_APPROVAL },
                { label: 'Team Management', sub: 'Add or edit admins', icon: UserCog, color: 'text-orange-500', bg: 'bg-orange-50', screen: Screen.ADMIN_MANAGEMENT },
                { label: 'Open Tickets', sub: '5 requires attention', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', screen: Screen.SUPPORT_SYSTEM },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => setScreen(action.screen)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl", action.bg, action.color)}>
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
                      <span className="text-slate-200">24%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">API Latency</span>
                    <span className="text-xs font-mono text-slate-200">42ms</span>
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

const CouponsMarketing = () => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Marketing</h1>
          <p className="text-gray-500 text-sm">Manage discounts and promotional campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all"
        >
          <Plus size={18} /> Create Coupon
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Coupons</h3>
            <div className="flex gap-2">
              <button className="text-xs font-bold text-yellow-600">All</button>
              <button className="text-xs font-bold text-gray-400">Expired</button>
            </div>
          </div>
          {mock.COUPONS.map((coupon) => (
            <Card key={coupon.id} className="flex items-center justify-between p-5 group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-2xl flex items-center justify-center">
                  <span className="text-xl font-black text-yellow-600">{coupon.discount}%</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-mono font-bold text-gray-900 tracking-wider uppercase">{coupon.code}</h4>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-xs text-gray-500">Valid until: {coupon.expiry}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                      <Users size={12} /> {coupon.usageCount} Uses
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                      <Ticket size={12} /> {coupon.limit} Limit
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg"><SettingsIcon size={18} /></button>
                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X size={18} /></button>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-0">
            <h3 className="font-bold text-sm mb-4">Marketing Tips</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              "SUMMER24" is your best performing coupon this month. Consider extending its duration for another 2 weeks.
            </p>
            <button className="w-full py-2.5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-xl">
              Apply Suggestion
            </button>
          </Card>

          <Card>
            <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Total Discount Given</span>
                  <span className="font-bold text-gray-900">$12,450</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Conversion Rate</span>
                  <span className="font-bold text-gray-900">4.2%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Coupon Code</label>
                    <input type="text" placeholder="e.g. SAVE20" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Discount %</label>
                    <input type="number" placeholder="20" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expiry Date</label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usage Limit</label>
                  <input type="number" placeholder="500" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Apply To</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
                    <option>All Events</option>
                    <option>Specific Partner</option>
                    <option>Category: Music</option>
                  </select>
                </div>
              </div>
              <div className="p-6 bg-gray-50">
                <button className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">
                  Generate Coupon
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupportSystem = () => {
  const [selectedChat, setSelectedChat] = useState<any>(mock.SUPPORT_CHATS[0]);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6">
      <div className="w-80 flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tickets..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>

        <Card className="flex-1 p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Tickets</h3>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">12</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {mock.SUPPORT_CHATS.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full p-4 text-left transition-colors flex gap-3",
                  selectedChat?.id === chat.id ? "bg-yellow-50/50" : "hover:bg-gray-50"
                )}
              >
                <div className="relative flex-shrink-0">
                  <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  {chat.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{chat.user}</h4>
                    <span className="text-[10px] text-gray-400">{chat.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex-1 p-0 overflow-hidden flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <img src={selectedChat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedChat.user}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><Phone size={18} /></button>
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><MoreVertical size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Today</span>
              </div>

              <div className="flex gap-3 max-w-[80%]">
                <img src={selectedChat.avatar} className="w-8 h-8 rounded-full object-cover mt-1" alt="" />
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Hello, I'm having trouble with my recent booking for the "Summer Music Fest". The payment went through but I haven't received my ticket yet.
                  </p>
                  <span className="text-[10px] text-gray-400 mt-2 block">10:24 AM</span>
                </div>
              </div>

              <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                  <p className="text-sm leading-relaxed">
                    Hi {selectedChat.user.split(' ')[0]}, I'm sorry to hear that. Let me check your transaction status right away. Could you please provide your booking ID?
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block text-right">10:26 AM</span>
                </div>
              </div>

              <div className="flex gap-3 max-w-[80%]">
                <img src={selectedChat.avatar} className="w-8 h-8 rounded-full object-cover mt-1" alt="" />
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Sure, it's #BK-98231.
                  </p>
                  <span className="text-[10px] text-gray-400 mt-2 block">10:27 AM</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3">
                <button className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><Plus size={20} /></button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>
                <button className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <h3 className="text-lg font-bold">Select a ticket to start</h3>
            <p className="text-sm">Choose from the list on the left to view conversation</p>
          </div>
        )}
      </Card>
    </div>
  );
};

const Settings = () => {
  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account and platform preferences</p>
      </header>

      <div className="space-y-6">
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Profile Information</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <img src="https://picsum.photos/seed/admin/200/200" className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl" alt="" />
                <button className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ImageIcon size={24} />
                </button>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input type="text" defaultValue="Alex Rivera" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" defaultValue="alex.rivera@tlb.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end">
            <button className="px-6 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-all">
              Save Changes
            </button>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Security</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 rounded-lg text-gray-900"><Shield size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-yellow-700">Add an extra layer of security to your account.</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white border border-yellow-200 text-yellow-700 text-xs font-bold rounded-lg hover:bg-yellow-100 transition-all">
                Enable 2FA
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Platform Notifications</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'New Partner Requests', desc: 'Get notified when a new partner applies' },
              { label: 'Event Approval Alerts', desc: 'Notifications for pending event reviews' },
              { label: 'System Maintenance', desc: 'Updates about scheduled platform downtime' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button className="w-12 h-6 bg-yellow-400 rounded-full relative p-1 transition-all">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const UserManagement = () => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage platform users and their activity</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-64 bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bookings</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mock.USERS.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                      <span className="text-sm font-bold text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.bookings}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">${user.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                      user.status === 'Active' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={16} /></button>
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const PaymentsFinance = () => {
  const [activeTab, setActiveTab] = useState('Transactions');
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>
        <div className="flex border-b border-gray-100">
          {['Transactions', 'Payouts', 'Refunds'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all relative",
                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="payTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Transaction ID or User..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <div className="flex gap-2">
          {activeTab === 'Transactions' && (
            <button
              onClick={() => setShowRegister(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-sm transition-all"
            >
              <Plus size={16} /> Register
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
            <Filter size={16} /> Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User / Partner</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mock.TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{tx.user}</p>
                    <p className="text-[10px] text-gray-400">{tx.partner}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">${tx.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Fee: $2.50</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                      tx.status === 'Completed' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                    )}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{tx.date}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">Showing 1-10 of 248 transactions</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-400 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-yellow-400 rounded-lg text-xs font-bold text-gray-900">1</button>
            <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600">2</button>
            <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600">Next</button>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegister(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Register Transaction</h2>
                <button onClick={() => setShowRegister(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction ID</label>
                    <input type="text" placeholder="e.g. TXN-12345" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount</label>
                    <input type="number" placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name</label>
                  <input type="text" placeholder="e.g. John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                    <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none">
                      <option>Completed</option>
                      <option>Pending</option>
                      <option>Failed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Attach Document</label>
                  <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-yellow-400 transition-colors cursor-pointer">
                    <FileText size={24} className="mb-2" />
                    <span className="text-sm font-medium">Click to upload document</span>
                    <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setShowRegister(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => setShowRegister(false)} className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">
                  Register
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FinanceDashboard = () => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-500 text-sm">Revenue flow and payout tracking</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
            Monthly View
          </button>
          <button className="px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900">
            Generate Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total GMV" value="$1.2M" trend="+15%" icon={CreditCard} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Platform Revenue" value="$184k" trend="+8%" icon={PieChart} colorClass="bg-green-50 text-green-600" />
        <StatCard title="Pending Payouts" value="$42k" trend="-2%" icon={Clock} colorClass="bg-orange-50 text-orange-600" />
        <StatCard title="Refund Rate" value="0.8%" trend="-0.1%" icon={ArrowLeft} colorClass="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-6">Revenue Inflow vs Outflow</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mock.BOOKINGS_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#FACC15" radius={[4, 4, 0, 0]} name="Inflow" />
                <Bar dataKey="value" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Outflow" opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-6">
          <h3 className="font-bold text-gray-900">Payout Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Verified Partners', count: 142, status: 'Ready', color: 'bg-green-500' },
              { label: 'Pending Verification', count: 12, status: 'On Hold', color: 'bg-yellow-500' },
              { label: 'Disputed Payments', count: 3, status: 'Review', color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">{item.label}</span>
                  <span className="text-xs text-gray-400">{item.count} partners</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            Process All Payouts
          </button>
        </Card>
      </div>
    </div>
  );
};

const EventApproval = () => {
  const [activeTab, setActiveTab] = useState('Pending List');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  if (selectedEvent) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedEvent(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} /> Back to List
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden">
              <img src="https://picsum.photos/seed/event/800/400" className="w-full h-64 object-cover" alt="" />
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h1>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wider">Draft</span>
                    </div>
                    <p className="text-gray-500">Partner: <span className="text-blue-500 font-medium">{selectedEvent.partner}</span></p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <ShieldCheck className="text-yellow-600" size={18} />
                    <span className="text-sm font-bold text-yellow-700">Quality Score: {selectedEvent.qualityScore}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
                    <Calendar size={16} className="text-gray-400" /> {selectedEvent.date}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
                    <Users size={16} className="text-gray-400" /> Ages {selectedEvent.ages}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
                    <MapPin size={16} className="text-gray-400" /> {selectedEvent.location}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={18} className="text-yellow-500" /> Description</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Experience the ultimate celebration of sound at the {selectedEvent.title}. Featuring three days of non-stop performances from world-class artists, immersive art installations, and a curated selection of gourmet food stalls.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                    <li>Main stage with 4k visuals</li>
                    <li>Interactive workshops</li>
                    <li>Eco-friendly camping grounds</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18} className="text-yellow-500" /> Pricing Tiers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Early Bird</p>
                      <p className="text-xl font-bold text-yellow-600">$149.00</p>
                      <p className="text-[10px] text-gray-400">Available until July 1</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">VIP Pass</p>
                      <p className="text-xl font-bold text-yellow-600">$399.00</p>
                      <p className="text-[10px] text-gray-400">Includes lounge access</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={18} className="text-yellow-500" /> Venue & Seat Layout</h3>
              <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200">
                <div className="w-16 h-10 border-2 border-yellow-400 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Interactive Seat Layout Active</p>
                <p className="text-[10px] text-gray-400">Venue: Olympic Park Stadium</p>
              </div>
              <button className="w-full mt-4 text-xs font-bold text-yellow-600 hover:text-yellow-700">Enlarge Map</button>
            </Card>

            <Card className="bg-green-50/50 border-green-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-green-600" /> Content Review Check</h3>
              <div className="space-y-3">
                {[
                  { label: 'Image Resolution', value: '4K Optimized' },
                  { label: 'Description Keywords', value: '8/10 matched' },
                  { label: 'Accessibility Tags', value: 'Complete' },
                ].map((check, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{check.label}</span>
                    <span className="font-bold text-green-600">{check.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-green-100">
                <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">Passed</span>
              </div>
            </Card>

            <Card className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><MessageSquare size={18} className="text-yellow-500" /> Review Feedback</h3>
              <textarea
                placeholder="Enter rejection reason or requested changes here..."
                className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
              />
              <div className="space-y-3">
                <button className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all">
                  Approve & Go Live
                </button>
                <button className="w-full py-3 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors">
                  Reject with Feedback
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Approve Event</h1>
        <div className="flex border-b border-gray-100">
          {['Pending List', 'Review Details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all relative",
                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="eventTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mock.EVENTS.map((event) => (
          <Card key={event.id} className="p-0 overflow-hidden group cursor-pointer" onClick={() => setSelectedEvent(event)}>
            <div className="relative h-48 overflow-hidden">
              <img src={`https://picsum.photos/seed/${event.id}/400/300`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
              <div className="absolute top-4 right-4 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-gray-900 shadow-sm">
                {event.status}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{event.title}</h3>
                <p className="text-xs text-gray-400">Partner: {event.partner}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} /> {event.date}
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState('Admins');
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <div className="flex border-b border-gray-100">
          {['Admins', 'Activity Log', 'Roles & Permissions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all relative",
                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 hover:bg-yellow-500 transition-all active:scale-[0.99]"
        >
          <UserCog size={20} /> Add New Admin
        </button>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrators</h3>
            <span className="text-xs text-gray-400">8 Active</span>
          </div>
          {mock.ADMINS.map((admin) => (
            <Card key={admin.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={admin.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{admin.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{admin.role}</span>
                    <span className="text-[10px] text-gray-400">Active • {admin.lastSeen}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                  <SettingsIcon size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <EyeOff size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Activity</h3>
            <button className="text-xs font-bold text-yellow-600">View Full Log</button>
          </div>
          <Card className="p-0 overflow-hidden">
            {[
              { admin: 'Alex Rivera', action: 'updated system permissions for', target: '"Event Moderators"', time: '15 mins ago', dept: 'System Management', color: 'bg-yellow-400' },
              { admin: 'Jordan Smith', action: 'approved', target: 'New User Verification queue', time: '1 hour ago', dept: 'User Operations', color: 'bg-blue-400' },
              { admin: 'Sarah Chen', action: 'modified event settings for', target: '"Global Tech Summit 2024"', time: '3 hours ago', dept: 'Event Coordination', color: 'bg-purple-400' },
            ].map((log, i) => (
              <div key={i} className="p-4 flex gap-4 border-b border-gray-50 last:border-0">
                <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5", log.color)} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">Admin {log.admin}</span> {log.action} <span className="italic">{log.target}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">{log.time}</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-[10px] text-gray-400">{log.dept}</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">New Admin Role</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Role</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all appearance-none">
                    <option>Marketing Lead</option>
                    <option>Finance Manager</option>
                    <option>Support Specialist</option>
                    <option>Operations Head</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Permissions</label>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-2xl">
                    {[
                      { label: 'View Revenue Analytics', checked: true },
                      { label: 'Approve Pending Events', checked: true },
                      { label: 'Manage Team Users', checked: false },
                      { label: 'Modify Billing Info', checked: false },
                    ].map((p, i) => (
                      <label key={i} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{p.label}</span>
                        <input type="checkbox" defaultChecked={p.checked} className="w-5 h-5 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50">
                <button className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all">
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PartnerManagement = () => {
  const [activeTab, setActiveTab] = useState('Requests');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search partners..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
            <Filter size={20} />
          </button>
        </div>
        <div className="flex border-b border-gray-100">
          {['Requests', 'Existing', 'Archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-all relative",
                activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab} {tab === 'Requests' && <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-bold">4</span>}
              {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Pending Approval</p>
        {mock.PARTNERS.filter(p => p.status === 'Pending').map((partner) => (
          <Card key={partner.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <img src={`https://picsum.photos/seed/${partner.id}/100/100`} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{partner.name}</h3>
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Applied: {partner.date}</p>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Type</p>
                    <p className="text-xs font-medium text-gray-700">{partner.type}</p>
                  </div>
                  <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                    <p className="text-xs font-medium text-gray-700">{partner.location}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Review
              </button>
              <button className="flex-1 md:flex-none px-6 py-2.5 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900 hover:bg-yellow-500 shadow-sm">
                Manage
              </button>
            </div>
          </Card>
        ))}

        <Card className="flex items-center justify-between bg-gray-50/50 border-dashed border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-400">Venue X Space</h3>
              <p className="text-xs text-gray-400">Applied: Oct 20, 2023</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">Rejected</span>
          <button className="text-sm font-bold text-gray-400 hover:text-gray-600">View Reason</button>
        </Card>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-4">Documents</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'License.pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
                      { name: 'Storefront.jpg', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { name: 'Tax_ID.docx', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' },
                    ].map((doc, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 cursor-pointer group">
                        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", doc.bg, doc.color)}>
                          <doc.icon size={24} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-600">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-4">Feedback Notes</h3>
                  <textarea
                    placeholder="Add notes for internal review..."
                    className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex gap-3">
                <button className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                  Reject
                </button>
                <button className="flex-1 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 transition-all">
                  Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Analytics = () => {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-gray-500 text-sm">Super Admin Portal</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
            <Calendar size={16} className="text-gray-400" /> Oct 1 - Oct 7, 2023
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900">
            <FileText size={16} /> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-yellow-400 rounded-xl text-sm font-bold text-gray-900">
            <BarChart3 size={16} /> Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><Ticket size={40} /></div>
          <p className="text-gray-500 text-sm font-medium">Current Bookings</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-gray-900">1,248</h3>
            <span className="text-xs font-bold text-green-500">+12.5%</span>
          </div>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><CreditCard size={40} /></div>
          <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-gray-900">$45,200</h3>
            <span className="text-xs font-bold text-red-500">-5.2%</span>
          </div>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-4 right-4 text-yellow-500 opacity-20"><Users size={40} /></div>
          <p className="text-gray-500 text-sm font-medium">Active Users</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-gray-900">856</h3>
            <span className="text-xs font-bold text-green-500">+8.1%</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Daily Bookings</h3>
            <span className="text-xs text-gray-400">Last 7 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mock.BOOKINGS_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#FEF9C3' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#FACC15" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900 mb-6">Revenue by Category</h3>
          <div className="flex items-center justify-center gap-8 h-64">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={mock.REVENUE_BY_CATEGORY}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mock.REVENUE_BY_CATEGORY.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {mock.REVENUE_BY_CATEGORY.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-gray-900 mb-6">Top 5 Events</h3>
          <div className="space-y-6">
            {mock.TOP_EVENTS.map((event, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-700">{event.name}</span>
                  <span className="text-gray-900">{event.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${event.value}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900 mb-6">Booking Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Confirmed', value: 842, color: 'bg-green-500', bg: 'bg-green-50', icon: CheckCircle },
              { label: 'Pending', value: 312, color: 'bg-orange-500', bg: 'bg-orange-50', icon: Clock },
              { label: 'Cancelled', value: 94, color: 'bg-red-500', bg: 'bg-red-50', icon: X },
            ].map((status, i) => (
              <div key={i} className={cn("flex items-center justify-between p-4 rounded-2xl", status.bg)}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl bg-white", status.color.replace('bg-', 'text-'))}>
                    <status.icon size={18} />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{status.label}</span>
                </div>
                <span className="font-bold text-gray-900">{status.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.DASHBOARD: return <Dashboard setScreen={setCurrentScreen} />;
      case Screen.PARTNER_MANAGEMENT: return <PartnerManagement />;
      case Screen.EVENT_APPROVAL: return <EventApproval />;
      case Screen.ADMIN_MANAGEMENT: return <AdminManagement />;
      case Screen.PAYMENTS_FINANCE: return <PaymentsFinance />;
      case Screen.FINANCE_DASHBOARD: return <FinanceDashboard />;
      case Screen.COUPONS_MARKETING: return <CouponsMarketing />;
      case Screen.SUPPORT_SYSTEM: return <SupportSystem />;
      case Screen.USER_MANAGEMENT: return <UserManagement />;
      case Screen.SETTINGS: return <Settings />;
      case Screen.ANALYTICS: return <Analytics />;
      default: return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
          <BarChart3 size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold">Screen Under Development</h2>
          <p className="text-sm">This module is coming soon in the next update.</p>
          <button
            onClick={() => setCurrentScreen(Screen.DASHBOARD)}
            className="mt-6 px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-40 overflow-hidden flex flex-col"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
            <ShieldCheck className="text-gray-900" size={24} />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">TLB ADMIN</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentScreen === Screen.DASHBOARD} onClick={() => setCurrentScreen(Screen.DASHBOARD)} />
          <SidebarItem icon={PieChart} label="Partner Management" active={currentScreen === Screen.PARTNER_MANAGEMENT} onClick={() => setCurrentScreen(Screen.PARTNER_MANAGEMENT)} />
          <SidebarItem icon={CheckCircle} label="Event Approval" active={currentScreen === Screen.EVENT_APPROVAL} onClick={() => setCurrentScreen(Screen.EVENT_APPROVAL)} />
          <SidebarItem icon={Users} label="User Management" active={currentScreen === Screen.USER_MANAGEMENT} onClick={() => setCurrentScreen(Screen.USER_MANAGEMENT)} />
          <SidebarItem icon={UserCog} label="Employee Admin Management" active={currentScreen === Screen.ADMIN_MANAGEMENT} onClick={() => setCurrentScreen(Screen.ADMIN_MANAGEMENT)} />
          <SidebarItem icon={BarChart3} label="Finance Dashboard" active={currentScreen === Screen.FINANCE_DASHBOARD} onClick={() => setCurrentScreen(Screen.FINANCE_DASHBOARD)} />
          <SidebarItem icon={CreditCard} label="Payments and Transactions" active={currentScreen === Screen.PAYMENTS_FINANCE} onClick={() => setCurrentScreen(Screen.PAYMENTS_FINANCE)} />
          <SidebarItem icon={Ticket} label="Marketing Coupons" active={currentScreen === Screen.COUPONS_MARKETING} onClick={() => setCurrentScreen(Screen.COUPONS_MARKETING)} />
          <SidebarItem icon={MessageSquare} label="Support System" active={currentScreen === Screen.SUPPORT_SYSTEM} onClick={() => setCurrentScreen(Screen.SUPPORT_SYSTEM)} />
          <SidebarItem icon={BarChart3} label="Analytics" active={currentScreen === Screen.ANALYTICS} onClick={() => setCurrentScreen(Screen.ANALYTICS)} />
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <SidebarItem icon={SettingsIcon} label="Settings" active={currentScreen === Screen.SETTINGS} onClick={() => setCurrentScreen(Screen.SETTINGS)} />
          <SidebarItem icon={LogOut} label="Logout" onClick={() => setIsLoggedIn(false)} />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-[280px]" : "ml-0")}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Vishesh S.</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Super Admin</p>
              </div>
              <img src="https://picsum.photos/seed/admin/100/100" className="w-10 h-10 rounded-xl border-2 border-yellow-400 p-0.5" alt="Avatar" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
