import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  /** When using ngrok: set to hostname only, e.g. lungeous-pura-desolatingly.ngrok-free.dev (fixes broken HMR / blank client) */
  const publicHost = env.VITE_DEV_PUBLIC_HOST?.trim() || ''

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      allowedHosts: true,
      ...(publicHost
        ? {
            origin: `https://${publicHost}`,
            hmr: {
              protocol: 'wss',
              host: publicHost,
              clientPort: 443,
            },
          }
        : {}),
    },
  }
})
