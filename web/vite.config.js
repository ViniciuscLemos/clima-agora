import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // em dev o Vite manda o /api pro servidor Node
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
