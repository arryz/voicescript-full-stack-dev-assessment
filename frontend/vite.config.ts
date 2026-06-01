import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@backend': fileURLToPath(new URL('../backend/src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/trpc': 'http://localhost:3001',
    },
  },
});
