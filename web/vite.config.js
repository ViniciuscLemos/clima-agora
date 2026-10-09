import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // in dev Vite forwards /api to the Node server
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
