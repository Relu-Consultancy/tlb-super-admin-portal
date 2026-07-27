import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutDashboard } from 'lucide-react';
import SidebarItem from './SidebarItem';

describe('SidebarItem', () => {
    it('renders the label text', () => {
        render(<SidebarItem icon={LayoutDashboard} label="Dashboard" active={false} onClick={vi.fn()} />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('applies active styles when active=true', () => {
        const { container } = render(
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={true} onClick={vi.fn()} />
        );
        const button = container.querySelector('button')!;
        expect(button.className).toContain('bg-amber-50');
        expect(button.className).toContain('border-amber-500');
    });

    it('applies inactive styles when active=false', () => {
        const { container } = render(
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={false} onClick={vi.fn()} />
        );
        const button = container.querySelector('button')!;
        expect(button.className).toContain('text-gray-600');
        expect(button.className).toContain('border-transparent');
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<SidebarItem icon={LayoutDashboard} label="Dashboard" active={false} onClick={handleClick} />);
        fireEvent.click(screen.getByText('Dashboard'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders a badge when provided', () => {
        render(
            <SidebarItem icon={LayoutDashboard} label="Events" active={false} onClick={vi.fn()} badge="Ticketing" badgeTone="coral" />
        );
        expect(screen.getByText('Ticketing')).toBeInTheDocument();
    });

    it('applies indent class when indent prop is true', () => {
        const { container } = render(
            <SidebarItem icon={LayoutDashboard} label="Events" active={false} onClick={vi.fn()} indent />
        );
        const button = container.querySelector('button')!;
        expect(button.className).toContain('pl-10');
    });
});
