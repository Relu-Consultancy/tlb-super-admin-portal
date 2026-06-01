import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventApproval from './EventApproval';

describe('EventApproval', () => {
    it('renders the Approve Event heading', () => {
        render(<EventApproval />);
        expect(screen.getByText('Approve Event')).toBeInTheDocument();
    });

    it('renders tab navigation', () => {
        render(<EventApproval />);
        expect(screen.getByText('Pending List')).toBeInTheDocument();
        expect(screen.getByText('Review Details')).toBeInTheDocument();
    });

    it('shows an empty state when there are no events', () => {
        render(<EventApproval />);
        expect(screen.getByText('No events yet')).toBeInTheDocument();
    });
});
