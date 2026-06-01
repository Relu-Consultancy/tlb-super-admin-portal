import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  /** Icon shown above the message. Defaults to an inbox. */
  icon?: LucideIcon;
  /** Short headline, e.g. "No partners yet". */
  title?: string;
  /** Optional supporting line. */
  description?: string;
  /** Optional action (e.g. a button) rendered below the text. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Neutral placeholder for screens/sections whose data source is not yet
 * connected. Keeps the surrounding layout intact while signalling "no data".
 */
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
