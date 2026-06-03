import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import { Screen } from '../../../types';

const defaultProps = {
    currentScreen: Screen.DASHBOARD,
    setCurrentScreen: vi.fn(),
    sidebarOpen: true,
    setIsLoggedIn: vi.fn(),
};

describe('Sidebar', () => {
    it('renders the TLB ADMIN brand text', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText('TLB ADMIN')).toBeInTheDocument();
    });

    it('renders all navigation labels', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Partner Management')).toBeInTheDocument();
        expect(screen.getByText('Event Approval')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Support System')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls setCurrentScreen with PARTNER_MANAGEMENT when Partner Management is clicked', () => {
        const setCurrentScreen = vi.fn();
        render(<Sidebar {...defaultProps} setCurrentScreen={setCurrentScreen} />);
        fireEvent.click(screen.getByText('Partner Management'));
        expect(setCurrentScreen).toHaveBeenCalledWith(Screen.PARTNER_MANAGEMENT);
    });

    it('calls setCurrentScreen with ANALYTICS when Analytics is clicked', () => {
        const setCurrentScreen = vi.fn();
        render(<Sidebar {...defaultProps} setCurrentScreen={setCurrentScreen} />);
        fireEvent.click(screen.getByText('Analytics'));
        expect(setCurrentScreen).toHaveBeenCalledWith(Screen.ANALYTICS);
    });

    it('calls setIsLoggedIn(false) when Logout is clicked', () => {
        const setIsLoggedIn = vi.fn();
        render(<Sidebar {...defaultProps} setIsLoggedIn={setIsLoggedIn} />);
        fireEvent.click(screen.getByText('Logout'));
        expect(setIsLoggedIn).toHaveBeenCalledWith(false);
    });
});
