import { useState } from 'react';
import {
    Image as ImageIcon,
    Shield,
    Loader2,
    CheckCircle2,
    AlertCircle,
    LogOut,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import { useAuth } from '../../shared/auth/AuthContext';
import { changePassword, ApiError, roleLabel } from '../../shared/lib/api';

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

function changePasswordMessage(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.isNetworkError) return 'Unable to reach the server. Please try again.';
        switch (err.code) {
            case 'INVALID_PASSWORD':
                return 'Your current password is incorrect.';
            case 'WEAK_PASSWORD':
                return 'New password does not meet the strength requirements.';
            case 'PASSWORD_REUSE':
                return 'You cannot reuse a recent password. Choose a different one.';
            default:
                return err.message || 'Could not change password. Please try again.';
        }
    }
    return 'Something went wrong. Please try again.';
}

const Settings = () => {
    const { admin, logoutAll } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwSubmitting, setPwSubmitting] = useState(false);

    const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
    const [loggingOutAll, setLoggingOutAll] = useState(false);
    const [logoutAllError, setLogoutAllError] = useState<string | null>(null);

    const handleLogoutAll = async () => {
        setLogoutAllError(null);
        setLoggingOutAll(true);
        try {
            // On success the session is revoked and the app drops to the login screen.
            await logoutAll();
        } catch {
            setLogoutAllError('Could not revoke sessions. Please try again.');
            setLoggingOutAll(false);
            setConfirmingLogoutAll(false);
        }
    };

    const avatarSrc = admin?.avatar || `https://picsum.photos/seed/${admin?.email || 'admin'}/200/200`;

    const handleChangePassword = async () => {
        setPwError(null);
        setPwSuccess(false);
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPwError('Current, new, and confirm password are all required.');
            return;
        }
        const issues = passwordIssues(newPassword);
        if (issues.length) {
            setPwError(`New password must contain ${issues.join(', ')}.`);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError('New passwords do not match.');
            return;
        }
        setPwSubmitting(true);
        try {
            await changePassword(currentPassword, newPassword, confirmPassword);
            setPwSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwError(changePasswordMessage(err));
        } finally {
            setPwSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 text-sm">Manage your account and platform preferences</p>
            </header>

            <div className="space-y-6">
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900">Profile Information</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <img src={avatarSrc} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl" alt="" />
                                <button className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gray-900">
                                    <ImageIcon size={24} />
                                </button>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                        <input type="text" readOnly value={admin?.full_name || '—'} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                        <input type="email" readOnly value={admin?.email || '—'} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role</label>
                                        <input type="text" readOnly value={admin ? roleLabel(admin.role) : '—'} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Department</label>
                                        <input type="text" readOnly value={admin?.department || '—'} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">Profile details are managed by a Super Admin and shown here for reference.</p>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900">Security</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {pwError && (
                            <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{pwError}</span>
                            </div>
                        )}
                        {pwSuccess && (
                            <div role="status" className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                                <span>Your password has been updated.</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                disabled={pwSubmitting}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={pwSubmitting}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={pwSubmitting}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleChangePassword}
                                disabled={pwSubmitting}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {pwSubmitting && <Loader2 size={16} className="animate-spin" />}
                                {pwSubmitting ? 'Updating…' : 'Update Password'}
                            </button>
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

                        {/* Log out of all devices */}
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg text-red-600"><LogOut size={20} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Active Sessions</p>
                                        <p className="text-xs text-red-700">Sign out of every device where your account is logged in.</p>
                                    </div>
                                </div>
                                {!confirmingLogoutAll ? (
                                    <button
                                        onClick={() => { setLogoutAllError(null); setConfirmingLogoutAll(true); }}
                                        className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all whitespace-nowrap"
                                    >
                                        Log out all devices
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setConfirmingLogoutAll(false)}
                                            disabled={loggingOutAll}
                                            className="px-3 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleLogoutAll}
                                            disabled={loggingOutAll}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {loggingOutAll && <Loader2 size={14} className="animate-spin" />}
                                            {loggingOutAll ? 'Revoking…' : 'Confirm log out'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {logoutAllError && (
                                <p className="mt-2 text-xs text-red-600">{logoutAllError}</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
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

export default Settings;
