import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalHealthMetrics from './GlobalHealthMetrics';

describe('GlobalHealthMetrics', () => {
    it('renders the ZONE 1 heading', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText(/ZONE 1: Global Health Metrics/)).toBeInTheDocument();
    });

    it('renders Active Ticket Buyers metric', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Active Ticket Buyers')).toBeInTheDocument();
        expect(screen.getByText('1,420 Parents')).toBeInTheDocument();
    });

    it('renders Active Platform Inquirers metric', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Active Platform Inquirers')).toBeInTheDocument();
        expect(screen.getByText('3,890 Parents')).toBeInTheDocument();
    });

    it('renders Dormant Accounts metric', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Dormant Accounts')).toBeInTheDocument();
        expect(screen.getByText('620 Parents')).toBeInTheDocument();
    });

    it('renders growth badges from mock data', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('+175 New Buyers')).toBeInTheDocument();
        expect(screen.getByText('+702 New Inquirers')).toBeInTheDocument();
    });

    it('renders the Broadcast Message button', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText('Broadcast Message to Cohort')).toBeInTheDocument();
    });

    it('renders location data for each metric', () => {
        render(<GlobalHealthMetrics />);
        expect(screen.getByText(/Khar & Andheri/)).toBeInTheDocument();
        expect(screen.getByText(/Juhu & Vashi/)).toBeInTheDocument();
    });
});
