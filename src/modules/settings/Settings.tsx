import {
    Image as ImageIcon,
    Shield,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';

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

export default Settings;
