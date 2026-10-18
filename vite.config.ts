import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { WS_PATH } from './shared/protocol.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lets testers outside the local network reach the dev server through a Cloudflare quick tunnel.
    allowedHosts: ['.trycloudflare.com'],
    // The game server (server/index.ts) runs separately; the browser reaches it through Vite.
    proxy: {
      [WS_PATH]: { target: 'ws://localhost:3001', ws: true },
    },
  },
})
