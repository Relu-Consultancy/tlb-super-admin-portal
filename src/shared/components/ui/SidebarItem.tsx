import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: string;
    badgeTone?: 'coral' | 'green' | 'blue';
    indent?: boolean;
}

const BADGE_COLORS: Record<string, string> = {
    coral: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-600',
};

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, badgeTone, indent }: SidebarItemProps) => (
    <button
        onClick={onClick}
        data-active={active}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group",
            indent && "pl-10",
            active
                ? "bg-amber-50 text-gray-900 font-semibold border-l-3 border-amber-500"
                : "text-gray-600 hover:bg-amber-50/50 hover:text-gray-900 border-l-3 border-transparent"
        )}
    >
        <Icon size={18} className={cn(active ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600')} />
        <span className="text-sm flex-1">{label}</span>
        {badge && (
            <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                BADGE_COLORS[badgeTone || 'green'] || BADGE_COLORS.green,
            )}>
                {badge}
            </span>
        )}
    </button>
);

export default SidebarItem;
