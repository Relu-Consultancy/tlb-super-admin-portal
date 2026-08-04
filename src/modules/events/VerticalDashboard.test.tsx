import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerticalDashboard from './VerticalDashboard';

vi.mock('motion/react', async () => {
    const React = await import('react');
    const cache: Record<string, any> = {};
    return {
        motion: new Proxy({}, { get(_: any, tag: string) {
            if (!cache[tag]) cache[tag] = ({ children, ...p }: any) => { const { initial, animate, exit, transition, layoutId, ...rest } = p; return React.createElement(tag as any, rest, children); };
            return cache[tag];
        } }),
        AnimatePresence: ({ children }: any) => children,
    };
});

vi.mock('../partners/PartnerManagement', () => ({
    default: (props: any) => <div>PartnerManagement:{props.category}:{String(props.lockCategory)}</div>,
}));
vi.mock('./EventApproval', () => ({
    default: (props: any) => <div>EventApproval:{props.listingType}:{String(props.lockType)}</div>,
}));
vi.mock('./tabs/OverviewTab', () => ({ default: (props: any) => <div>OverviewTab:{props.vertical}</div> }));
vi.mock('./tabs/TicketingTab', () => ({ default: (props: any) => <div>TicketingTab:{props.vertical}</div> }));
vi.mock('./tabs/FinancialsTab', () => ({ default: (props: any) => <div>FinancialsTab:{props.vertical}</div> }));
vi.mock('./tabs/ReportsTab', () => ({ default: (props: any) => <div>ReportsTab:{props.vertical}</div> }));
vi.mock('./tabs/SupportTab', () => ({ default: (props: any) => <div>SupportTab:{props.vertical}</div> }));

describe('VerticalDashboard', () => {
    it('renders the vertical label and defaults to the Overview tab', () => {
        render(<VerticalDashboard vertical="event" />);
        expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
        expect(screen.getByText('OverviewTab:event')).toBeInTheDocument();
    });

    it('switches to each tab and passes the vertical/lock props through', async () => {
        render(<VerticalDashboard vertical="venue" />);

        await userEvent.click(screen.getByText('Partner directory'));
        expect(screen.getByText('PartnerManagement:Venues:true')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Listing directory'));
        expect(screen.getByText('EventApproval:venue:true')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Ticketing'));
        expect(screen.getByText('TicketingTab:venue')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Financials'));
        expect(screen.getByText('FinancialsTab:venue')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Reports'));
        expect(screen.getByText('ReportsTab:venue')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Support'));
        expect(screen.getByText('SupportTab:venue')).toBeInTheDocument();
    });

    it('only shows the period filter on tabs that use it', async () => {
        render(<VerticalDashboard vertical="event" />);
        expect(screen.getByText('This Month')).toBeInTheDocument(); // Overview needs it

        await userEvent.click(screen.getByText('Partner directory'));
        expect(screen.queryByText('This Month')).not.toBeInTheDocument();

        await userEvent.click(screen.getByText('Reports'));
        expect(screen.queryByText('This Month')).not.toBeInTheDocument();
    });
});
