import { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import SidebarItem from '../ui/SidebarItem';
import { Screen } from '../../../types';
import { SIDEBAR_ENTRIES, isActiveItem, type SidebarEntry, type ListingVertical } from '../../nav/sections';

interface SidebarProps {
    currentScreen: Screen;
    onSelectScreen: (s: Screen, listingType?: ListingVertical) => void;
    /** Which listing vertical is active — distinguishes the Partners sub-items. */
    activeListingType?: ListingVertical | '';
    sidebarOpen: boolean;
    onLogout: () => void;
}

const Sidebar = ({ currentScreen, onSelectScreen, activeListingType, sidebarOpen, onLogout }: SidebarProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['partners']));

    const toggleGroup = (id: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderEntry = (entry: SidebarEntry, idx: number) => {
        if (entry.kind === 'item') {
            const { item } = entry;
            const active = isActiveItem(item, currentScreen, activeListingType);
            return (
                <SidebarItem
                    key={`${item.screen}-${idx}`}
                    icon={item.icon}
                    label={item.label}
                    active={active}
                    onClick={() => onSelectScreen(item.screen, item.listingType)}
                    badge={item.badge}
                    badgeTone={item.badgeTone}
                />
            );
        }

        // Expandable group (Partners)
        const { group } = entry;
        const isExpanded = expandedGroups.has(group.id);
        const isGroupActive = group.items.some((i) => i.screen === currentScreen || !!i.match?.includes(currentScreen));

        return (
            <div key={group.id}>
                <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group',
                        isGroupActive
                            ? 'text-gray-900 font-semibold'
                            : 'text-gray-600 hover:bg-amber-50/50 hover:text-gray-900',
                    )}
                >
                    <group.icon
                        size={18}
                        className={cn(isGroupActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600')}
                    />
                    <div className="flex-1 min-w-0">
                        <span className="text-sm block">{group.label}</span>
                        {group.subtitle && (
                            <span className="text-[10px] text-gray-400 block truncate">{group.subtitle}</span>
                        )}
                    </div>
                    <ChevronDown
                        size={14}
                        className={cn(
                            'text-gray-400 transition-transform duration-200',
                            isExpanded && 'rotate-180',
                        )}
                    />
                </button>
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-0.5 mt-0.5">
                                {group.items.map((item, i) => {
                                    const active = isActiveItem(item, currentScreen, activeListingType);
                                    return (
                                        <SidebarItem
                                            key={`${item.label}-${i}`}
                                            icon={item.icon}
                                            label={item.label}
                                            active={active}
                                            onClick={() => onSelectScreen(item.screen, item.listingType)}
                                            badge={item.badge}
                                            badgeTone={item.badgeTone}
                                            indent
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
            className="fixed inset-y-0 left-0 bg-[#faf8f4] border-r border-[#e8e5de] z-50 overflow-hidden flex flex-col"
        >
            {/* Logo */}
            <div className="px-5 py-5 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center font-bold text-gray-900 text-sm shadow-sm">
                    TLB
                </div>
                <span className="text-base font-bold text-gray-900 tracking-tight">TLB admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-0.5">
                {SIDEBAR_ENTRIES.map((entry, idx) => renderEntry(entry, idx))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-4">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50/50 transition-all text-left"
                >
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
