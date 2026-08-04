import { BarChart3 } from 'lucide-react';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { VERTICAL_CONFIG } from '../../../shared/nav/verticals';
import type { ListingVertical } from '../../../shared/nav/sections';

interface ReportsTabProps {
    vertical: ListingVertical;
}

/**
 * Category/age-group/location/weekday breakdowns and top-performing listings need
 * backend analytics aggregates that don't exist anywhere in the API layer yet — this
 * is a placeholder rather than a screen built on fabricated numbers.
 */
const ReportsTab = ({ vertical }: ReportsTabProps) => (
    <EmptyState
        icon={BarChart3}
        title="Reports coming soon"
        description={`Category, age-group, location, and weekday breakdowns for ${VERTICAL_CONFIG[vertical].label.toLowerCase()} need backend analytics support that isn't available yet.`}
    />
);

export default ReportsTab;
