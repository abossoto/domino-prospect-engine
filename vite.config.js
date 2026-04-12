import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['pptxgenjs'] },
  server: {
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  }
});
