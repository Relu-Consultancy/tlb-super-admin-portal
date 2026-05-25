import { cn } from '../../lib/utils';
import Card from './Card';

const StatCard = ({ title, value, trend, icon: Icon, colorClass }: any) => (
    <Card className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
            <div className={cn("p-2 rounded-xl", colorClass || "bg-yellow-50 text-yellow-600")}>
                <Icon size={20} />
            </div>
            {trend && (
                <span className={cn("text-xs font-medium", trend.startsWith('+') ? "text-green-500" : "text-red-500")}>
                    {trend}
                </span>
            )}
        </div>
        <div className="mt-2">
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    </Card>
);

export default StatCard;
