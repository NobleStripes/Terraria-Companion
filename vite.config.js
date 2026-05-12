import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icon.svg', 'icons.svg'],
            manifest: {
                name: 'Terraria Companion',
                short_name: 'TerrariaCompanion',
                description: 'A companion app for Terraria with item lookup, boss tracker, and loadout planning.',
                theme_color: '#1e1b4b',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                navigateFallback: 'index.html',
                globPatterns: ['**/*.{js,css,html,svg,ico,png,webp,woff2}'],
                globIgnores: ['**/data-*.js'],
            },
        }),
    ],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router'))
                        return 'vendor';
                    if (id.includes('node_modules/fuse.js'))
                        return 'search';
                    if (id.includes('node_modules/zustand'))
                        return 'state';
                },
            },
        },
    },
});
