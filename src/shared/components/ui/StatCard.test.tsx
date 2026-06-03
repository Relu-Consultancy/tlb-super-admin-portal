import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Ticket } from 'lucide-react';
import StatCard from './StatCard';

describe('StatCard', () => {
    it('renders title and value', () => {
        render(<StatCard title="Bookings" value="1,248" icon={Ticket} />);
        expect(screen.getByText('Bookings')).toBeInTheDocument();
        expect(screen.getByText('1,248')).toBeInTheDocument();
    });

    it('shows a positive trend in green', () => {
        render(<StatCard title="Revenue" value="$10k" trend="+12%" icon={Ticket} />);
        const trend = screen.getByText('+12%');
        expect(trend).toBeInTheDocument();
        expect(trend.className).toContain('text-green-500');
    });

    it('shows a negative trend in red', () => {
        render(<StatCard title="Refunds" value="$200" trend="-3%" icon={Ticket} />);
        const trend = screen.getByText('-3%');
        expect(trend).toBeInTheDocument();
        expect(trend.className).toContain('text-red-500');
    });

    it('renders without trend badge when trend is not provided', () => {
        render(<StatCard title="Events" value="42" icon={Ticket} />);
        // No trend text at all
        expect(screen.queryByText('%')).toBeNull();
    });

    it('applies a custom colorClass to the icon container', () => {
        const { container } = render(
            <StatCard title="GMV" value="$1.2M" icon={Ticket} colorClass="bg-blue-50 text-blue-600" />
        );
        const iconWrapper = container.querySelector('.bg-blue-50');
        expect(iconWrapper).toBeInTheDocument();
    });
});
