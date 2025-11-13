// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const offlineNotifierPlugin = {
  fetchDidFail: async ({ request }) => {
    if (typeof self === 'undefined' || !self.clients) {
      return;
    }

    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({
        type: 'WORKBOX_NETWORK_FAILURE',
        url: request.url,
      });
    });
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Puedes activar proxy si NO quieres tocar CORS en backend durante dev:
  const USE_PROXY = true; // Activar proxy para desarrollo

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: 'Gestión Académica',
          short_name: 'Gestión Académica',
          description: 'Seguimiento de horarios y asistencia académica con funciones offline.',
          theme_color: '#0f172a',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'vite.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
            {
              src: 'vite.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname === '/',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'start-url',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-datos',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
                plugins: [offlineNotifierPlugin],
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/importaciones/descargar-plantilla'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
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
