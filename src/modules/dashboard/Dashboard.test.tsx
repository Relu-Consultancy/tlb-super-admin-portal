import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { Screen } from '../../types';

describe('Dashboard', () => {
    const mockSetScreen = vi.fn();

    beforeEach(() => {
        mockSetScreen.mockClear();
    });

    it('renders the Super Admin Dashboard heading', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    it("renders Today's Overview section", () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText("Today's Overview")).toBeInTheDocument();
    });

    it('renders all four stat cards', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Bookings')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('New Users')).toBeInTheDocument();
        expect(screen.getByText('Active Events')).toBeInTheDocument();
    });

    it('renders All-time Statistics section', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('All-time Statistics')).toBeInTheDocument();
    });

    it('renders Quick Actions section', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Approve Partners')).toBeInTheDocument();
        expect(screen.getByText('Approve Events')).toBeInTheDocument();
        expect(screen.getByText('Team Management')).toBeInTheDocument();
        expect(screen.getByText('Open Tickets')).toBeInTheDocument();
    });

    it('renders System Status panel', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('Server Load')).toBeInTheDocument();
        expect(screen.getByText('API Latency')).toBeInTheDocument();
    });

    it('calls setScreen with PARTNER_MANAGEMENT when Approve Partners is clicked', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        fireEvent.click(screen.getByText('Approve Partners'));
        expect(mockSetScreen).toHaveBeenCalledWith(Screen.PARTNER_MANAGEMENT);
    });

    it('calls setScreen with EVENT_APPROVAL when Approve Events is clicked', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        fireEvent.click(screen.getByText('Approve Events'));
        expect(mockSetScreen).toHaveBeenCalledWith(Screen.EVENT_APPROVAL);
    });

    it('calls setScreen with SUPPORT_SYSTEM when Open Tickets is clicked', () => {
        render(<Dashboard setScreen={mockSetScreen} />);
        fireEvent.click(screen.getByText('Open Tickets'));
        expect(mockSetScreen).toHaveBeenCalledWith(Screen.SUPPORT_SYSTEM);
    });
});
