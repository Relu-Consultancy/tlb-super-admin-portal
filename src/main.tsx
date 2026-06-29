import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './shared/auth/AuthContext';
import ErrorBoundary from './shared/components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary label="app">
            <AuthProvider>
                <App />
            </AuthProvider>
        </ErrorBoundary>
    </StrictMode>,
);