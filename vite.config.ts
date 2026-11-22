import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ plugins: [react()], base: './', build: { rollupOptions: { input: { editor: resolve(import.meta.dirname, 'index.html'), player: resolve(import.meta.dirname, 'player.html') } } } });
