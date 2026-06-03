import { useState } from 'react';
import { Mail, ShieldCheck, Loader2, ArrowLeft, MailCheck, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../shared/lib/utils';
import { forgotPassword, ApiError } from '../../shared/lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordScreenProps {
  /** Return to the login screen. */
  onBack: () => void;
}

const ForgotPasswordScreen = ({ onBack }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.isNetworkError
          ? 'Unable to reach the server. Check your connection and try again.'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to login
        </button>

        {sent ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <MailCheck className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="text-gray-500 text-sm mt-2">
              If an account exists for <span className="font-semibold">{email.trim()}</span>, a
              password reset link has been sent. The link expires in 30 minutes.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-8 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
            >
              Return to login
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="text-yellow-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
              <p className="text-gray-500 text-sm text-center">
                Enter your admin email and we'll send you a reset link.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@tlb-events.com"
                    autoComplete="email"
                    disabled={submitting}
                    aria-invalid={!!error}
                    className={cn(
                      'w-full bg-gray-50 border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60',
                      error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-yellow-400',
                    )}
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </motion.div>
      <p className="mt-8 text-gray-400 text-xs text-center">
        TLB Event Management Platform © 2024
      </p>
    </div>
  );
};

export default ForgotPasswordScreen;
