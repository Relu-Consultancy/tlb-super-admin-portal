/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react(), tailwindcss()],
        define: {
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-charts': ['recharts'],
                        'vendor-motion': ['motion/react'],
                        'vendor-icons': ['lucide-react'],
                    },
                },
            },
        },
        server: {
            // HMR is disabled in AI Studio via DISABLE_HMR env var.
            // Do not modify—file watching is disabled to prevent flickering during agent edits.
            hmr: process.env.DISABLE_HMR !== 'true',
            // Allow ngrok tunnels (the subdomain changes per session, so allow the whole domain).
            allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/tests/setup.ts'],
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            css: false,
        },
    };
});
