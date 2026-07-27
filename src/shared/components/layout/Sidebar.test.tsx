import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import { Screen } from '../../../types';

vi.mock('motion/react', () => {
    const handler: ProxyHandler<Record<string, unknown>> = {
        get: (_t, tag: string) =>
            typeof tag === 'string'
                ? (props: any) => {
                    const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
                    const Tag = tag === 'aside' ? 'aside' : 'div';
                    return <Tag {...rest} />;
                }
                : undefined,
    };
    const motion = new Proxy({} as Record<string, unknown>, handler);
    return {
        motion,
        AnimatePresence: ({ children }: any) => children,
    };
});

const base = {
    currentScreen: Screen.DASHBOARD,
    onSelectScreen: vi.fn(),
    sidebarOpen: true,
    onLogout: vi.fn(),
};

describe('Sidebar', () => {
    it('renders the brand and flat navigation items', () => {
        render(<Sidebar {...base} />);
        expect(screen.getByText('TLB admin')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Customers')).toBeInTheDocument();
        expect(screen.getByText('Partners')).toBeInTheDocument();
        expect(screen.getByText('Support')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows Partners sub-items (expanded by default)', () => {
        render(<Sidebar {...base} />);
        // Partners group should be expanded showing sub-items
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Programs')).toBeInTheDocument();
        expect(screen.getByText('Classes')).toBeInTheDocument();
        expect(screen.getByText('Venues')).toBeInTheDocument();
    });

    it('shows type badges on partner sub-items', () => {
        render(<Sidebar {...base} />);
        expect(screen.getByText('Ticketing')).toBeInTheDocument();
        expect(screen.getAllByText('Enquiry').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Hybrid')).toBeInTheDocument();
    });

    it('navigates when a sidebar item is clicked', () => {
        const onSelectScreen = vi.fn();
        render(<Sidebar {...base} onSelectScreen={onSelectScreen} />);
        fireEvent.click(screen.getByText('Support'));
        expect(onSelectScreen).toHaveBeenCalledWith(Screen.SUPPORT_SYSTEM, undefined);
    });

    it('passes the listing vertical when a Partners sub-item is clicked', () => {
        const onSelectScreen = vi.fn();
        render(<Sidebar {...base} onSelectScreen={onSelectScreen} />);
        fireEvent.click(screen.getByText('Programs'));
        expect(onSelectScreen).toHaveBeenCalledWith(Screen.EVENT_APPROVAL, 'program');
    });

    it('highlights only the active Partners vertical, not all four', () => {
        render(
            <Sidebar
                {...base}
                currentScreen={Screen.EVENT_APPROVAL}
                activeListingType="venue"
            />,
        );
        // Every sub-item shares Screen.EVENT_APPROVAL — only the matching type is active.
        expect(screen.getByText('Venues').closest('button')).toHaveAttribute('data-active', 'true');
        expect(screen.getByText('Events').closest('button')).toHaveAttribute('data-active', 'false');
        expect(screen.getByText('Programs').closest('button')).toHaveAttribute('data-active', 'false');
        expect(screen.getByText('Classes').closest('button')).toHaveAttribute('data-active', 'false');
    });

    it('calls onLogout when Logout is clicked', () => {
        const onLogout = vi.fn();
        render(<Sidebar {...base} onLogout={onLogout} />);
        fireEvent.click(screen.getByText('Logout'));
        expect(onLogout).toHaveBeenCalled();
    });
});
