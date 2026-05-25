import { useState } from 'react';
import { BarChart3, Bell, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './shared/lib/utils';
import { Screen } from './types';

// Layout
import Sidebar from './shared/components/layout/Sidebar';

// Modules
import LoginScreen from './modules/auth/LoginScreen';
import Dashboard from './modules/dashboard/Dashboard';
import PartnerManagement from './modules/partners/PartnerManagement';
import EventApproval from './modules/events/EventApproval';
import AdminManagement from './modules/admin/AdminManagement';
import PaymentsFinance from './modules/finance/PaymentsFinance';
import FinanceDashboard from './modules/finance/FinanceDashboard';
import CouponsMarketing from './modules/marketing/CouponsMarketing';
import SupportSystem from './modules/support/SupportSystem';
import UserManagement from './modules/users/UserManagement';
import Settings from './modules/settings/Settings';
import Analytics from './modules/analytics/Analytics';
import UserSection from './modules/users/UserSection/UserSection';

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
      case Screen.USER_SECTION: return <UserSection />;
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
      <Sidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        sidebarOpen={sidebarOpen}
        setIsLoggedIn={setIsLoggedIn}
      />

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
