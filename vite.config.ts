import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendTarget = env.VITE_BACKEND_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/login': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/logout': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/csrf-token': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/affiliation-applications': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/portal/credits': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/admin/affiliation-applications': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/admin/associates': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/admin/credits': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/fpqrs-submissions': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
