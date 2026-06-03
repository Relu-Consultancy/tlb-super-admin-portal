import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutDashboard } from 'lucide-react';
import SidebarItem from './SidebarItem';

describe('SidebarItem', () => {
    it('renders the label text', () => {
        render(<SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={vi.fn()} />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('applies active styles when active=true', () => {
        const { container } = render(
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={true} onClick={vi.fn()} />
        );
        const button = container.querySelector('button')!;
        expect(button.className).toContain('bg-yellow-400');
        expect(button.className).not.toContain('text-gray-500');
    });

    it('applies inactive styles when active=false', () => {
        const { container } = render(
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={false} onClick={vi.fn()} />
        );
        const button = container.querySelector('button')!;
        expect(button.className).toContain('text-gray-500');
        expect(button.className).not.toContain('bg-yellow-400');
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={handleClick} />);
        fireEvent.click(screen.getByText('Dashboard'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders without active prop (defaults to inactive styling)', () => {
        const { container } = render(
            <SidebarItem icon={LayoutDashboard} label="Partners" onClick={vi.fn()} />
        );
        const button = container.querySelector('button')!;
        expect(button.className).not.toContain('bg-yellow-400');
    });
});
