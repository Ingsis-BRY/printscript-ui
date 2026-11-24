import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL),
      'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL)
    },
    plugins: [react()],
    resolve: {
      // `vite --mode e2e` (Cypress): a logged-in fake Auth0, so the stubbed suite needs no real tenant.
      // Every other mode, the production build included, uses the real @auth0/auth0-react.
      alias: mode === 'e2e'
        ? [{ find: '@auth0/auth0-react', replacement: fileURLToPath(new URL('./src/testing/fakeAuth0.tsx', import.meta.url)) }]
        : [],
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
