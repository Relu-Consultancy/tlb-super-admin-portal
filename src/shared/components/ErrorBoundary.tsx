import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    /** Optional label for the area being guarded, shown in the fallback. */
    label?: string;
    /** When this value changes, the boundary resets (e.g. on screen switch). */
    resetKey?: unknown;
}

interface State {
    error: Error | null;
}

/**
 * Catches render-time errors in its subtree and shows a recoverable fallback
 * instead of unmounting the whole app to a blank screen. Without this, a single
 * throw (or a lazy-chunk load failure over a flaky tunnel) takes the entire SPA
 * down to white.
 */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Surface the real error in the console for debugging.
        console.error('[ErrorBoundary] caught:', error, info.componentStack);
    }

    componentDidUpdate(prev: Props) {
        if (prev.resetKey !== this.props.resetKey && this.state.error) {
            this.setState({ error: null });
        }
    }

    private reset = () => this.setState({ error: null });

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        const isChunkError = /loading chunk|dynamically imported module|failed to fetch/i.test(error.message);

        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl shadow-sm p-8 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle className="text-red-500" size={26} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {isChunkError ? 'Failed to load this section' : 'Something went wrong'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {isChunkError
                            ? 'A part of the app could not be downloaded. This is usually a network hiccup — reloading fixes it.'
                            : `The ${this.props.label ?? 'screen'} hit an unexpected error and could not be displayed.`}
                    </p>
                    {error.message && (
                        <pre className="mt-4 text-left text-[11px] text-red-600 bg-red-50 rounded-xl p-3 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                            {error.message}
                        </pre>
                    )}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                            onClick={this.reset}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all"
                        >
                            <RefreshCw size={15} /> Try again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
