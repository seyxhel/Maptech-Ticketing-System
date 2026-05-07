import { defineConfig } from 'vite'

// https://vitejs.dev/config/
const strictContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk='",
  "style-src 'self' 'nonce-maptech-csp-v1' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.up.railway.app https://*.herokuapp.com https://*.railway.app",
  "media-src 'self' data: blob: https://*.up.railway.app https://*.herokuapp.com https://*.railway.app",
  "connect-src 'self' http://localhost:8000 ws://localhost:8000 http://127.0.0.1:8000 ws://127.0.0.1:8000 https://*.up.railway.app https://*.herokuapp.com https://*.railway.app https://api.pwnedpasswords.com",
].join('; ')

const strictSecurityHeaders = {
  'Content-Security-Policy': strictContentSecurityPolicy,
}

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('xlsx') || id.includes('xlsx-js-style')) return 'xlsx'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf'

          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
      '/ws': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
  preview: {
    headers: strictSecurityHeaders,
  },
})
