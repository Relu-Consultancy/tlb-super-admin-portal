import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

function Boom({ msg }: { msg: string }): never {
    throw new Error(msg);
}

describe('ErrorBoundary', () => {
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
    afterEach(() => vi.restoreAllMocks());

    it('renders children when there is no error', () => {
        render(<ErrorBoundary><p>hello</p></ErrorBoundary>);
        expect(screen.getByText('hello')).toBeInTheDocument();
    });

    it('shows a fallback with the error message when a child throws', () => {
        render(<ErrorBoundary label="screen"><Boom msg="kaboom-detail" /></ErrorBoundary>);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('kaboom-detail')).toBeInTheDocument();
    });

    it('recognises a chunk-load failure with a tailored message', () => {
        render(<ErrorBoundary><Boom msg="Failed to fetch dynamically imported module: /x.js" /></ErrorBoundary>);
        expect(screen.getByText('Failed to load this section')).toBeInTheDocument();
    });

    it('resets when resetKey changes', async () => {
        const { rerender } = render(
            <ErrorBoundary resetKey="a"><Boom msg="x" /></ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        rerender(<ErrorBoundary resetKey="b"><p>recovered</p></ErrorBoundary>);
        expect(await screen.findByText('recovered')).toBeInTheDocument();
    });

    it('Try again clears the error and re-renders children', async () => {
        let shouldThrow = true;
        function Maybe() {
            if (shouldThrow) throw new Error('first');
            return <p>ok now</p>;
        }
        render(<ErrorBoundary><Maybe /></ErrorBoundary>);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        shouldThrow = false;
        await userEvent.click(screen.getByRole('button', { name: /Try again/i }));
        expect(await screen.findByText('ok now')).toBeInTheDocument();
    });
});
