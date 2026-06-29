import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Derive the Supabase host from VITE_SUPABASE_URL so the service worker
  // runtime caching rules below track whatever project this build targets
  // (prod vs staging). Hardcoding the project ref would silently break PWA
  // caching whenever the deploy points at a different Supabase project.
  const env = loadEnv(mode, process.cwd(), '')
  let supabaseHost = ''
  try {
    supabaseHost = new URL(env.VITE_SUPABASE_URL).host
  } catch {
    supabaseHost = ''
  }
  // Escape for use inside a RegExp; '(?!)' never matches, so a missing/invalid
  // URL just disables Supabase runtime caching instead of crashing the build.
  const host = supabaseHost
    ? supabaseHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : '(?!)'

  return {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'icons/*.png'],
      manifest: {
        name: 'Ziteoo',
        short_name: 'Ziteoo',
        description: 'La plataforma que construye Bolivia',
        theme_color: '#A43700',
        background_color: '#f9f9f9',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es-BO',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshots/home.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Push handler lives in sw-push.js (imported via importScripts in the SW)
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            // Supabase REST API — NetworkFirst so live data takes priority; fallback to cache
            urlPattern: new RegExp(`^https://${host}/rest/.*`, 'i'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Supabase Storage — CacheFirst, images/files don't change often
            urlPattern: new RegExp(`^https://${host}/storage/.*`, 'i'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          {
            // Supabase Edge Functions — NetworkFirst, always want fresh responses
            urlPattern: new RegExp(`^https://${host}/functions/.*`, 'i'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-functions-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 15,
            },
          },
          {
            // Google Fonts stylesheets — StaleWhileRevalidate
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts files — CacheFirst, font files are immutable
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
    // Upload source maps to Sentry only on production builds.
    // Requires SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT env vars
    // (set in CI, not committed). In local dev this plugin is a no-op because
    // the env vars are absent and the plugin skips gracefully.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only run during production builds — avoids slowing down dev HMR
      disable: process.env.NODE_ENV !== 'production',
      sourcemaps: {
        // Delete local source maps after upload so they aren't served publicly
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
    // Bundle visualizer — only active when ANALYZE=true (npm run analyze)
    ...(process.env.ANALYZE === 'true'
      ? [visualizer({ open: false, filename: 'dist/stats.html', gzipSize: true })]
      : []),
  ],
  build: {
    // 'hidden' genera los source maps (para que Sentry pueda subirlos y dar
    // stack traces legibles) pero NO añade el comentario //# sourceMappingURL
    // al JS, así que los navegadores/público no los descubren ni descargan.
    // Combinado con filesToDeleteAfterUpload (abajo), los .map se borran tras
    // subirse a Sentry y nunca quedan expuestos en producción.
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor'
          if (id.includes('node_modules/@supabase/')) return 'supabase'
          if (id.includes('node_modules/@tanstack/')) return 'query'
          if (id.includes('node_modules/@sentry/')) return 'sentry'
          if (id.includes('node_modules/posthog-js/')) return 'posthog'
        },
      },
    },
  },
  }
})
