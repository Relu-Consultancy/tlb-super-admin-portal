import { cn } from '../../lib/utils';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
            active
                ? "bg-gray-900 text-white font-semibold shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
    >
        <Icon size={18} />
        <span className="text-sm">{label}</span>
    </button>
);

export default SidebarItem;
