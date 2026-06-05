import {
    LayoutDashboard,
    Users,
    CheckCircle,
    UserCog,
    CreditCard,
    PieChart,
    Ticket,
    TicketPlus,
    MessageSquare,
    BarChart3,
    LogOut,
    ShieldCheck,
    Settings as SettingsIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import SidebarItem from '../ui/SidebarItem';
import { Screen } from '../../../types';

interface SidebarProps {
    currentScreen: Screen;
    setCurrentScreen: (s: Screen) => void;
    sidebarOpen: boolean;
    setIsLoggedIn: (v: boolean) => void;
}

const Sidebar = ({ currentScreen, setCurrentScreen, sidebarOpen, setIsLoggedIn }: SidebarProps) => (
    <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-50 overflow-hidden flex flex-col"
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
            <SidebarItem icon={CheckCircle} label="Listings Approval" active={currentScreen === Screen.EVENT_APPROVAL} onClick={() => setCurrentScreen(Screen.EVENT_APPROVAL)} />
            <SidebarItem icon={Users} label="User Management" active={currentScreen === Screen.USER_MANAGEMENT} onClick={() => setCurrentScreen(Screen.USER_MANAGEMENT)} />
            <SidebarItem icon={Users} label="User Section (New)" active={currentScreen === Screen.USER_SECTION} onClick={() => setCurrentScreen(Screen.USER_SECTION)} />
            <SidebarItem icon={UserCog} label="Employee Admin Management" active={currentScreen === Screen.ADMIN_MANAGEMENT} onClick={() => setCurrentScreen(Screen.ADMIN_MANAGEMENT)} />
            <SidebarItem icon={BarChart3} label="Finance Dashboard" active={currentScreen === Screen.FINANCE_DASHBOARD} onClick={() => setCurrentScreen(Screen.FINANCE_DASHBOARD)} />
            <SidebarItem icon={CreditCard} label="Payments and Transactions" active={currentScreen === Screen.PAYMENTS_FINANCE} onClick={() => setCurrentScreen(Screen.PAYMENTS_FINANCE)} />
            <SidebarItem icon={Ticket} label="Marketing Coupons" active={currentScreen === Screen.COUPONS_MARKETING} onClick={() => setCurrentScreen(Screen.COUPONS_MARKETING)} />
            <SidebarItem icon={TicketPlus} label="Create Coupon" active={currentScreen === Screen.CREATE_COUPON} onClick={() => setCurrentScreen(Screen.CREATE_COUPON)} />
            <SidebarItem icon={MessageSquare} label="Support System" active={currentScreen === Screen.SUPPORT_SYSTEM} onClick={() => setCurrentScreen(Screen.SUPPORT_SYSTEM)} />
            <SidebarItem icon={BarChart3} label="Analytics" active={currentScreen === Screen.ANALYTICS} onClick={() => setCurrentScreen(Screen.ANALYTICS)} />
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
            <SidebarItem icon={SettingsIcon} label="Settings" active={currentScreen === Screen.SETTINGS} onClick={() => setCurrentScreen(Screen.SETTINGS)} />
            <SidebarItem icon={LogOut} label="Logout" onClick={() => setIsLoggedIn(false)} />
        </div>
    </motion.aside>
);

export default Sidebar;
