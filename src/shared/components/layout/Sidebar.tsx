import { Home, LogOut, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import SidebarItem from '../ui/SidebarItem';
import { Screen } from '../../../types';
import { SECTIONS, getSection, type SectionId } from '../../nav/sections';

interface SidebarProps {
    currentScreen: Screen;
    /** The section the user is currently working in; null = the Home hub. */
    activeSection: SectionId | null;
    onSelectScreen: (s: Screen) => void;
    onEnterSection: (id: SectionId) => void;
    onHome: () => void;
    sidebarOpen: boolean;
    setIsLoggedIn: (v: boolean) => void;
}

const Sidebar = ({ currentScreen, activeSection, onSelectScreen, onEnterSection, onHome, sidebarOpen, setIsLoggedIn }: SidebarProps) => {
    const section = activeSection ? getSection(activeSection) : null;

    return (
        <motion.aside
            initial={false}
            animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
            className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-50 overflow-hidden flex flex-col"
        >
            <button onClick={onHome} className="p-6 flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                    <ShieldCheck className="text-gray-900" size={24} />
                </div>
                <span className="text-xl font-black text-gray-900 tracking-tight">TLB ADMIN</span>
            </button>

            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                <SidebarItem icon={Home} label="Home" active={currentScreen === Screen.HOME} onClick={onHome} />

                {section ? (
                    <>
                        {/* Active section header + back to all sections */}
                        <button
                            onClick={onHome}
                            className="w-full flex items-center gap-2 px-4 pt-5 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                        >
                            <ChevronLeft size={13} /> {section.label}
                        </button>
                        {section.items.map((item) => (
                            <SidebarItem
                                key={item.screen}
                                icon={item.icon}
                                label={item.label}
                                active={currentScreen === item.screen || !!item.match?.includes(currentScreen)}
                                onClick={() => onSelectScreen(item.screen)}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        {/* Home hub — the three workspaces */}
                        <p className="px-4 pt-5 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Workspaces</p>
                        {SECTIONS.map((s) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => onEnterSection(s.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group"
                                >
                                    <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.accent.icon)}>
                                        <Icon size={16} />
                                    </span>
                                    <span className="text-sm font-medium flex-1">{s.label}</span>
                                    <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500" />
                                </button>
                            );
                        })}
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <SidebarItem icon={LogOut} label="Logout" onClick={() => setIsLoggedIn(false)} />
            </div>
        </motion.aside>
    );
};

export default Sidebar;
