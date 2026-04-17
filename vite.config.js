import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
    plugins: [react(), tailwindcss()],
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
