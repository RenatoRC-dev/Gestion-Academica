// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Puedes activar proxy si NO quieres tocar CORS en backend durante dev:
  const USE_PROXY = true; // Activar proxy para desarrollo

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      // Si quieres proxy para /api en dev:
      proxy: USE_PROXY
        ? {
          '/api': {
            target: env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000',
            changeOrigin: true,
            secure: false,
          },
        }
        : undefined,
    },
    preview: {
      port: 4173,
      strictPort: true,
      open: true,
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      outDir: 'dist',
    },
    define: {
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'App'),
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || mode),
    },
  };
});
