import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PeriodFilter from './PeriodFilter';

describe('PeriodFilter', () => {
    it('renders the five standard filters', () => {
        render(<PeriodFilter value="this_month" onChange={() => {}} />);
        ['As of Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom Range'].forEach((label) => {
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        });
    });

    it('emits the selected period on click', () => {
        const onChange = vi.fn();
        render(<PeriodFilter value="this_month" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Last 7 Days' }));
        expect(onChange).toHaveBeenCalledWith('last_7_days');
    });

    it('shows custom date inputs only when Custom Range is active', () => {
        const { rerender } = render(<PeriodFilter value="this_month" onChange={() => {}} onDateChange={() => {}} />);
        expect(screen.queryByLabelText('From date')).not.toBeInTheDocument();
        rerender(<PeriodFilter value="custom" onChange={() => {}} onDateChange={() => {}} />);
        expect(screen.getByLabelText('From date')).toBeInTheDocument();
        expect(screen.getByLabelText('To date')).toBeInTheDocument();
    });
});
