import { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../shared/lib/utils';
import { resetPassword, ApiError } from '../../shared/lib/api';

interface ResetPasswordScreenProps {
  token: string;
  /** Called after a successful reset (or when the user chooses to return to login). */
  onDone: () => void;
}

/** Password rules from API doc §2: min 8, upper, lower, digit, special. */
function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(pw)) issues.push('an uppercase letter');
  if (!/[a-z]/.test(pw)) issues.push('a lowercase letter');
  if (!/[0-9]/.test(pw)) issues.push('a digit');
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push('a special character');
  return issues;
}

function resetErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) return 'Unable to reach the server. Check your connection and try again.';
    switch (err.code) {
      case 'INVALID_RESET_TOKEN':
        return 'This reset link is invalid or has expired. Please request a new one.';
      case 'WEAK_PASSWORD':
        return 'Password does not meet the strength requirements.';
      case 'PASSWORD_REUSE':
        return 'You cannot reuse a recent password. Choose a different one.';
      default:
        return err.message || 'Could not reset password. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

const ResetPasswordScreen = ({ token, onDone }: ResetPasswordScreenProps) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const issues = passwordIssues(password);
    if (issues.length) {
      setFieldError(`Password must contain ${issues.join(', ')}.`);
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    try {
      await resetPassword(token, password, confirm);
      setDone(true);
    } catch (err) {
      setFormError(resetErrorMessage(err));
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
        {done ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Password updated</h1>
            <p className="text-gray-500 text-sm mt-2">
              Your password has been reset. You can now log in with your new password.
            </p>
            <button
              type="button"
              onClick={onDone}
              className="mt-8 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
            >
              Go to login
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="text-yellow-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
              <p className="text-gray-500 text-sm text-center">Choose a new password for your account.</p>
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
                <label htmlFor="reset-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldError) setFieldError(null);
                    }}
                    placeholder="Enter a strong password"
                    autoComplete="new-password"
                    disabled={submitting}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all disabled:opacity-60"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reset-confirm" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm"
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (fieldError) setFieldError(null);
                    }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={submitting}
                    className={cn(
                      'w-full bg-gray-50 border rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60',
                      fieldError ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-yellow-400',
                    )}
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                {fieldError && <p className="mt-1.5 text-xs text-red-600">{fieldError}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? 'Resetting…' : 'Reset password'}
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

export default ResetPasswordScreen;
