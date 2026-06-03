import { useState } from 'react';
import {
    UserCog,
    EyeOff,
    X,
    Settings as SettingsIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/ui/Card';
import { cn } from '../lib/utils';
import * as mock from '../mockData';

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

            <AnimatePresence mode="wait">
                {activeTab === 'Admins' && (
                    <motion.div
                        key="admins"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 hover:bg-yellow-500 transition-all active:scale-[0.99]"
                        >
                            <UserCog size={20} /> Add New Admin
                        </button>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrators</h3>
                                <span className="text-xs text-gray-400">{mock.ADMINS.length} Active</span>
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
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h3>
                                <button onClick={() => setActiveTab('Activity Log')} className="text-xs font-bold text-yellow-600 hover:text-yellow-700">View Full Log</button>
                            </div>
                            <Card className="p-0 overflow-hidden">
                                {mock.ACTIVITY_LOGS.slice(0, 3).map((log) => (
                                    <div key={log.id} className="p-4 flex gap-4 border-b border-gray-50 last:border-0">
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
                    </motion.div>
                )}

                {activeTab === 'Activity Log' && (
                    <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Activity Log</h3>
                            <span className="text-xs text-gray-400">{mock.ACTIVITY_LOGS.length} entries</span>
                        </div>
                        <Card className="p-0 overflow-hidden">
                            {mock.ACTIVITY_LOGS.map((log) => (
                                <div key={log.id} className="p-4 flex gap-4 border-b border-gray-50 last:border-0">
                                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", log.color)} />
                                    <div className="flex-1 min-w-0">
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
                    </motion.div>
                )}

                {activeTab === 'Roles & Permissions' && (
                    <motion.div
                        key="roles"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Roles & Permissions</h3>
                            <span className="text-xs text-gray-400">{mock.ROLES_AND_PERMISSIONS.length} roles</span>
                        </div>
                        <div className="space-y-4">
                            {mock.ROLES_AND_PERMISSIONS.map((role) => (
                                <Card key={role.id} className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{role.role}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                                            <span className="inline-block mt-2 text-[10px] text-gray-400">{role.admins} admin{role.admins !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-w-xs">
                                            {role.permissions.map((perm, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md">
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all shrink-0">
                                            <SettingsIcon size={18} />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

export default AdminManagement;
