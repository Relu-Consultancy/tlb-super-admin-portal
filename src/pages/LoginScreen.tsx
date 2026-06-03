import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck className="text-yellow-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">TLB Admin Team</h1>
                    <p className="text-gray-500 text-sm">Secure access for super admins</p>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="name@tlb-events.com"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
                    >
                        Login
                    </button>

                    <button type="button" className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        Forgot Password?
                    </button>
                </form>
            </motion.div>
            <p className="mt-8 text-gray-400 text-xs text-center">TLB Event Management Platform © 2024</p>
        </div>
    );
};

export default LoginScreen;
