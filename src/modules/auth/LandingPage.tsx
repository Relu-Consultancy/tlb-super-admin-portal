import { motion } from 'motion/react';
import {
  ShieldCheck,
  ArrowRight,
  Users,
  CalendarCheck,
  Wallet,
  LifeBuoy,
} from 'lucide-react';

interface LandingPageProps {
  /** Navigate to the login screen. */
  onGetStarted: () => void;
}

const FEATURES = [
  { icon: Users, title: 'User & Partner Control', desc: 'Oversee every account, partner, and approval from one place.' },
  { icon: CalendarCheck, title: 'Event Approvals', desc: 'Review and greenlight events with a streamlined workflow.' },
  { icon: Wallet, title: 'Finance & Payouts', desc: 'Track revenue, transactions, and commissions in real time.' },
  { icon: LifeBuoy, title: 'Support System', desc: 'Resolve tickets and chat with customers without leaving the panel.' },
];

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-gray-900" size={22} />
          </div>
          <span className="font-bold text-gray-900 text-lg">TLB Admin</span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          Login
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
            <ShieldCheck size={14} /> Super Admin Portal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            The command center for{' '}
            <span className="text-yellow-500">The Little Bub</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
            Manage users, partners, events, finances, coupons, and support — all
            from a single, secure dashboard built for the TLB admin team.
          </p>

          <button
            onClick={onGetStarted}
            className="mt-10 inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
          >
            Login to Dashboard <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 w-full max-w-5xl"
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left"
            >
              <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="text-yellow-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="text-center text-gray-400 text-xs py-8">
        TLB Event Management Platform © 2024
      </footer>
    </div>
  );
};

export default LandingPage;
