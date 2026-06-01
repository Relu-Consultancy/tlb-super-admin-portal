import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalHealthMetrics from './GlobalHealthMetrics';

describe('GlobalHealthMetrics', () => {
    it('renders the ZONE 1 heading', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText(/ZONE 1: Global Health Metrics/)).toBeInTheDocument();
    });

    it('renders the metric labels', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Active Ticket Buyers')).toBeInTheDocument();
        expect(screen.getByText('Active Platform Inquirers')).toBeInTheDocument();
        expect(screen.getByText('Dormant Accounts')).toBeInTheDocument();
    });

    it('renders the Broadcast Message button', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Broadcast Message to Cohort')).toBeInTheDocument();
    });
});
