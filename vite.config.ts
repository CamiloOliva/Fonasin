import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendTarget = env.VITE_BACKEND_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/affiliation-applications': {
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
