import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BarChart3, Bell, Menu, LogOut, Settings as SettingsIcon, Megaphone, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './shared/lib/utils';
import { useAuth } from './shared/auth/AuthContext';
import { roleLabel } from './shared/lib/api';
import { Screen } from './types';

// Layout
import Sidebar from './shared/components/layout/Sidebar';
import ErrorBoundary from './shared/components/ErrorBoundary';

// Lazy-loaded modules (code-split per screen)
const LandingPage = lazy(() => import('./modules/auth/LandingPage'));
const LoginScreen = lazy(() => import('./modules/auth/LoginScreen'));
const ForgotPasswordScreen = lazy(() => import('./modules/auth/ForgotPasswordScreen'));
const ResetPasswordScreen = lazy(() => import('./modules/auth/ResetPasswordScreen'));
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const PartnerManagement = lazy(() => import('./modules/partners/PartnerManagement'));
const EventApproval = lazy(() => import('./modules/events/EventApproval'));
const AdminManagement = lazy(() => import('./modules/admin/AdminManagement'));
const PaymentsFinance = lazy(() => import('./modules/finance/PaymentsFinance'));
const FinanceDashboard = lazy(() => import('./modules/finance/FinanceDashboard'));
const CouponsMarketing = lazy(() => import('./modules/marketing/CouponsMarketing'));
const CreateCoupon = lazy(() => import('./modules/marketing/CreateCoupon'));
const SupportSystem = lazy(() => import('./modules/support/SupportSystem'));
const UserManagement = lazy(() => import('./modules/users/UserManagement'));
const Broadcasts = lazy(() => import('./modules/broadcasts/Broadcasts'));
const UserAppAlignment = lazy(() => import('./modules/userapp/UserAppAlignment'));
const Settings = lazy(() => import('./modules/settings/Settings'));
const Analytics = lazy(() => import('./modules/analytics/Analytics'));
const UserSection = lazy(() => import('./modules/users/UserSection/UserSection'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="loader" />
  </div>
);

const FullScreenLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="loader" />
  </div>
);

type AuthView = 'landing' | 'login' | 'forgot';

/** Detect a password-reset deep link, e.g. `/reset-password?token=...` or `?reset_token=...`. */
function getResetToken(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('reset_token') ||
    (window.location.pathname.includes('reset-password') ? params.get('token') : null)
  );
}

export default function App() {
  const { status, admin, logout, sessionMessage, clearSessionMessage } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('landing');
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  // Open by default on desktop; collapsed on mobile so content isn't pushed off-screen.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1024,
  );
  const [resetToken] = useState<string | null>(() => getResetToken());

  // Header dropdowns (notifications + profile menu)
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close header dropdowns on an outside click.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Always land on the Dashboard whenever a session becomes authenticated
  // (fresh login or a logout -> login cycle, since App stays mounted).
  useEffect(() => {
    if (status === 'authenticated') {
      setCurrentScreen(Screen.DASHBOARD);
    }
  }, [status]);

  // Password-reset deep link takes priority over everything else.
  if (resetToken) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <ResetPasswordScreen
          token={resetToken}
          onDone={() => {
            // Strip the token from the URL and return to login.
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
            setAuthView('login');
            window.location.reload();
          }}
        />
      </Suspense>
    );
  }

  if (status === 'loading') {
    return <FullScreenLoader />;
  }

  if (status !== 'authenticated') {
    // A forced logout / expiry should drop the user straight to the login form.
    const view: AuthView = sessionMessage ? 'login' : authView;
    return (
      <Suspense fallback={<FullScreenLoader />}>
        {view === 'landing' && (
          <LandingPage onGetStarted={() => setAuthView('login')} />
        )}
        {view === 'login' && (
          <LoginScreen
            onBack={() => setAuthView('landing')}
            onForgotPassword={() => setAuthView('forgot')}
          />
        )}
        {view === 'forgot' && (
          <ForgotPasswordScreen
            onBack={() => {
              clearSessionMessage();
              setAuthView('login');
            }}
          />
        )}
      </Suspense>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.DASHBOARD: return <Dashboard setScreen={setCurrentScreen} />;
      case Screen.PARTNER_MANAGEMENT: return <PartnerManagement />;
      case Screen.EVENT_APPROVAL: return <EventApproval />;
      case Screen.ADMIN_MANAGEMENT: return <AdminManagement />;
      case Screen.PAYMENTS_FINANCE: return <PaymentsFinance />;
      case Screen.FINANCE_DASHBOARD: return <FinanceDashboard />;
      case Screen.COUPONS_MARKETING: return <CouponsMarketing onCreateCoupon={() => setCurrentScreen(Screen.CREATE_COUPON)} />;
      case Screen.CREATE_COUPON: return (
        <CreateCoupon
          onBack={() => setCurrentScreen(Screen.COUPONS_MARKETING)}
          onCreated={() => setCurrentScreen(Screen.COUPONS_MARKETING)}
        />
      );
      case Screen.SUPPORT_SYSTEM: return <SupportSystem />;
      case Screen.USER_MANAGEMENT: return <UserManagement />;
      case Screen.BROADCASTS: return <Broadcasts />;
      case Screen.USERAPP_ALIGNMENT: return <UserAppAlignment />;
      case Screen.SETTINGS: return <Settings />;
      case Screen.ANALYTICS: return <Analytics />;
      case Screen.USER_SECTION: return <UserSection setScreen={setCurrentScreen} />;
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

  const displayName = admin?.full_name || admin?.email || 'Admin';
  const displayRole = admin ? roleLabel(admin.role) : '';

  // On mobile the sidebar is an overlay drawer — pick a screen and close it so
  // the content is visible again.
  const selectScreen = (s: Screen) => {
    setCurrentScreen(s);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        setCurrentScreen={selectScreen}
        sidebarOpen={sidebarOpen}
        setIsLoggedIn={(v) => { if (!v) logout(); }}
      />

      {/* Mobile backdrop — closes the drawer when tapped (desktop pushes content instead) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className={cn("flex-1 min-w-0 transition-all duration-300", sidebarOpen ? "lg:ml-[280px]" : "ml-0")}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                aria-label="Notifications"
                className={cn('p-2 rounded-xl transition-colors', notifOpen ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50')}
              >
                <Bell size={20} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-900">Notifications</p>
                  </div>
                  <div className="px-4 py-8 text-center">
                    <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">You're all caught up — no new notifications.</p>
                  </div>
                  <button
                    onClick={() => { setNotifOpen(false); setCurrentScreen(Screen.BROADCASTS); }}
                    className="w-full flex items-center gap-2 px-4 py-3 border-t border-gray-50 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Megaphone size={14} className="text-yellow-500" /> Send a broadcast
                  </button>
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative pl-4 border-l border-gray-100" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                className="flex items-center gap-2.5 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{displayName}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{displayRole}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center font-bold text-gray-900">
                  {(displayName || 'A').slice(0, 1).toUpperCase()}
                </div>
                <ChevronDown size={16} className={cn('text-gray-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                    {admin?.email && <p className="text-xs text-gray-500 truncate">{admin.email}</p>}
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{displayRole}</span>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); setCurrentScreen(Screen.SETTINGS); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <SettingsIcon size={16} className="text-gray-400" /> Settings
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <ErrorBoundary label="screen" resetKey={currentScreen}>
            <Suspense fallback={<LoadingFallback />}>
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
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
