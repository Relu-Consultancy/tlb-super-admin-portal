import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data yet',
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6 text-gray-400',
      className,
    )}
  >
    <Icon size={48} className="mb-4 opacity-30" />
    <h3 className="text-base font-bold text-gray-500">{title}</h3>
    {description && <p className="text-sm mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
