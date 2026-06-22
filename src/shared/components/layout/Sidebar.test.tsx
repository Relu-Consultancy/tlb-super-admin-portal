import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import { Screen } from '../../../types';

const base = {
    currentScreen: Screen.HOME,
    activeSection: null,
    onSelectScreen: vi.fn(),
    onEnterSection: vi.fn(),
    onHome: vi.fn(),
    sidebarOpen: true,
    setIsLoggedIn: vi.fn(),
};

describe('Sidebar', () => {
    it('renders the brand and Home + workspaces on the hub', () => {
        render(<Sidebar {...base} />);
        expect(screen.getByText('TLB ADMIN')).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('User / Customer')).toBeInTheDocument();
        expect(screen.getByText('Partner')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('enters a section when a workspace is clicked on the hub', () => {
        const onEnterSection = vi.fn();
        render(<Sidebar {...base} onEnterSection={onEnterSection} />);
        fireEvent.click(screen.getByText('Partner'));
        expect(onEnterSection).toHaveBeenCalledWith('partner');
    });

    it('shows the active section\'s items when inside a section', () => {
        render(<Sidebar {...base} activeSection="admin" currentScreen={Screen.FINANCE_DASHBOARD} />);
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Marketing Coupons')).toBeInTheDocument();
        // hub workspaces are not shown while inside a section
        expect(screen.queryByText('Workspaces')).not.toBeInTheDocument();
    });

    it('selects a screen when a section item is clicked', () => {
        const onSelectScreen = vi.fn();
        render(<Sidebar {...base} activeSection="partner" currentScreen={Screen.PARTNER_MANAGEMENT} onSelectScreen={onSelectScreen} />);
        fireEvent.click(screen.getByText('Listings Approval'));
        expect(onSelectScreen).toHaveBeenCalledWith(Screen.EVENT_APPROVAL);
    });

    it('goes home from the section header', () => {
        const onHome = vi.fn();
        render(<Sidebar {...base} activeSection="admin" onHome={onHome} />);
        // The section header label (Admin) is the back-to-hub control.
        fireEvent.click(screen.getByText('Admin'));
        expect(onHome).toHaveBeenCalled();
    });

    it('calls setIsLoggedIn(false) when Logout is clicked', () => {
        const setIsLoggedIn = vi.fn();
        render(<Sidebar {...base} setIsLoggedIn={setIsLoggedIn} />);
        fireEvent.click(screen.getByText('Logout'));
        expect(setIsLoggedIn).toHaveBeenCalledWith(false);
    });
});
