import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
    it('renders children', () => {
        render(<Card>Hello Card</Card>);
        expect(screen.getByText('Hello Card')).toBeInTheDocument();
    });

    it('applies default styling classes', () => {
        const { container } = render(<Card>Content</Card>);
        const div = container.firstChild as HTMLElement;
        expect(div.className).toContain('bg-white');
        expect(div.className).toContain('rounded-xl');
        expect(div.className).toContain('shadow-sm');
    });

    it('merges custom className without conflict', () => {
        const { container } = render(<Card className="bg-yellow-50 p-4">Content</Card>);
        const div = container.firstChild as HTMLElement;
        // bg-yellow-50 overrides bg-white
        expect(div.className).toContain('bg-yellow-50');
        expect(div.className).not.toContain('bg-white');
    });

    it('spreads additional HTML attributes', () => {
        render(<Card data-testid="my-card">Content</Card>);
        expect(screen.getByTestId('my-card')).toBeInTheDocument();
    });
});
