import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/node_modules[\\/]lucide-react/.test(id)) {
              return 'vendor-icons';
            }
            if (/node_modules[\\/](@supabase[\\/]supabase-js)/.test(id)) {
              return 'vendor-supabase';
            }
            if (/node_modules[\\/](react|react-dom|react-router|react-router-dom)/.test(id)) {
              return 'vendor-react';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});