import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: /v1 is proxied to the Laravel API, so no CORS setup is needed locally.
// Production: set VITE_API_URL (e.g. https://api.example.com/v1) and add this site to CORS_ALLOWED_ORIGINS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/v1': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:8000', changeOrigin: true },
    },
  },
})
