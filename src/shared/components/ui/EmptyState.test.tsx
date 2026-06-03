import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
    it('renders a default title', () => {
        render(<EmptyState />);
        expect(screen.getByText('No data yet')).toBeInTheDocument();
    });

    it('renders a custom title and description', () => {
        render(<EmptyState title="No partners" description="Nothing here yet." />);
        expect(screen.getByText('No partners')).toBeInTheDocument();
        expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    });

    it('renders an action node when provided', () => {
        render(<EmptyState action={<button>Do it</button>} />);
        expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument();
    });

    it('accepts a custom icon without crashing', () => {
        const { container } = render(<EmptyState icon={Users} title="Custom" />);
        expect(screen.getByText('Custom')).toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
