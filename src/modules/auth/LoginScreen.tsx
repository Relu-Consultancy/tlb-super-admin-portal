import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../shared/lib/utils';
import { ApiError } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginScreenProps {
  /** Navigate back to the landing page. */
  onBack?: () => void;
  /** Navigate to the forgot-password screen. */
  onForgotPassword?: () => void;
}

/** Map a backend error to a friendly message (API doc §1). */
function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) return 'Unable to reach the server. Check your connection and try again.';
    switch (err.code) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password.';
      case 'ADMIN_INACTIVE':
        return 'Your account has been deactivated. Contact a Super Admin.';
      case 'ADMIN_LOCKED':
        return 'Your account is locked after too many attempts. Contact your Super Admin to unlock it.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please try again in a few minutes.';
      default:
        return err.message || 'Login failed. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

const LoginScreen = ({ onBack, onForgotPassword }: LoginScreenProps) => {
  const { login, sessionMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // On success the AuthProvider flips status -> authenticated and the app
      // re-renders to the dashboard; nothing more to do here.
    } catch (err) {
      setFormError(loginErrorMessage(err));
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
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="text-yellow-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TLB Admin Team</h1>
          <p className="text-gray-500 text-sm">Secure access for super admins</p>
        </div>

        {sessionMessage && !formError && (
          <div
            role="status"
            className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3 mb-6"
          >
            <Info size={18} className="shrink-0 mt-0.5" />
            <span>{sessionMessage}</span>
          </div>
        )}

        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">
              Admin Email
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="name@tlb-events.com"
                autoComplete="email"
                disabled={submitting}
                aria-invalid={!!errors.email}
                className={cn(
                  'w-full bg-gray-50 border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60',
                  errors.email
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-yellow-400',
                )}
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={submitting}
                aria-invalid={!!errors.password}
                className={cn(
                  'w-full bg-gray-50 border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60',
                  errors.password
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-yellow-400',
                )}
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting ? 'Signing in…' : 'Login'}
          </button>

          <button
            type="button"
            onClick={onForgotPassword}
            className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Forgot Password?
          </button>
        </form>
      </motion.div>
      <p className="mt-8 text-gray-400 text-xs text-center">
        TLB Event Management Platform © 2024
      </p>
    </div>
  );
};

export default LoginScreen;
