import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Permite el host del túnel de testeo (ngrok). Solo dev.
    allowedHosts: ['.ngrok-free.app'],
    // SOLO para testeo con túnel: la app llama a /api-backend/... y vite lo
    // reenvía al backend local. Así el backend NUNCA se expone a internet:
    // todo pasa por el único túnel del frontend.
    // Uso: VITE_API_AUTH_URL=/api-backend/auth npm run dev -- --host
    proxy: {
      '/api-backend': {
        target: 'http://localhost:8000/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-backend/, ''),
      },
    },
  },
})
