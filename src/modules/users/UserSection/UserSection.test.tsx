import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserSection from './UserSection';

// Mock child components to avoid data-shape issues and isolate UserSection logic
vi.mock('./GlobalHealthMetrics', () => ({
    default: () => <div data-testid="global-health-metrics">GlobalHealthMetrics</div>,
}));

vi.mock('./UserDirectoryGrid', () => ({
    default: ({ onOpenHistory }: any) => (
        <div data-testid="user-directory-grid">
            <button onClick={() => onOpenHistory({ name: 'Test User', id: '#TLB-U-0001', email: 'test@tlb.com' })}>
                View History
            </button>
        </div>
    ),
}));

vi.mock('./UserHistorySlideOut', () => ({
    default: ({ user, onClose }: any) => (
        <div data-testid="user-history-slideout">
            <span>{user?.name}</span>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

describe('UserSection', () => {
    it('renders the User Management Dashboard heading', () => {
        render(<UserSection />);
        expect(screen.getByText('User Management Dashboard')).toBeInTheDocument();
    });

    it('renders the sub-heading', () => {
        render(<UserSection />);
        expect(screen.getByText('Global health metrics and interactive user directory')).toBeInTheDocument();
    });

    it('renders GlobalHealthMetrics component', () => {
        render(<UserSection />);
        expect(screen.getByTestId('global-health-metrics')).toBeInTheDocument();
    });

    it('renders UserDirectoryGrid component', () => {
        render(<UserSection />);
        expect(screen.getByTestId('user-directory-grid')).toBeInTheDocument();
    });

    it('does not show slide-out panel initially', () => {
        render(<UserSection />);
        expect(screen.queryByTestId('user-history-slideout')).not.toBeInTheDocument();
    });

    it('shows UserHistorySlideOut when View History is clicked', () => {
        render(<UserSection />);
        fireEvent.click(screen.getByText('View History'));
        expect(screen.getByTestId('user-history-slideout')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('closes slide-out when onClose is called', () => {
        render(<UserSection />);
        fireEvent.click(screen.getByText('View History'));
        expect(screen.getByTestId('user-history-slideout')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByTestId('user-history-slideout')).not.toBeInTheDocument();
    });
});
