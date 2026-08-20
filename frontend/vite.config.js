import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: {
      '/api': {
        // Keep the development proxy aligned with the FastAPI application's
        // default local port (see backend/main.py).
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8002',
        changeOrigin: true,
      }
    }
  }
})
