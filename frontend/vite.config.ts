import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target:
          loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ||
          'http://localhost:8001',
        changeOrigin: true,
      },
      '/sanctum': {
        target:
          loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ||
          'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@mocks': path.resolve(__dirname, './public/mocks'),
    },
  },
}));
