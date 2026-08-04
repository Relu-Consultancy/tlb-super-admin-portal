import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
    id: string;
    label: string;
    icon?: LucideIcon;
}

interface TabsProps {
    tabs: TabItem[];
    active: string;
    onChange: (id: string) => void;
    /** A stable layoutId so multiple Tabs instances on the page don't share the underline animation. */
    layoutId: string;
    className?: string;
}

/** A horizontal underline tab bar (amber active indicator), shared across tabbed screens. */
const Tabs = ({ tabs, active, onChange, layoutId, className }: TabsProps) => (
    <div className={cn('flex border-b border-gray-200 overflow-x-auto', className)}>
        {tabs.map((tab) => (
            <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors relative whitespace-nowrap',
                    active === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600',
                )}
            >
                {tab.icon && <tab.icon size={15} />}
                {tab.label}
                {active === tab.id && (
                    <motion.div layoutId={layoutId} className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                )}
            </button>
        ))}
    </div>
);

export default Tabs;
