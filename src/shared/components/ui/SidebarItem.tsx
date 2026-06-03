import { cn } from '../../lib/utils';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
            active
                ? "bg-yellow-400 text-gray-900 font-semibold shadow-md shadow-yellow-400/20"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        )}
    >
        <Icon size={20} />
        <span className="text-sm">{label}</span>
    </button>
);

export default SidebarItem;
