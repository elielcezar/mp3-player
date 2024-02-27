import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext'
  },
  proxy: {
    '/api': {
         target: 'https://bancomusical.com.br',
         changeOrigin: true,
         secure: true,      
         ws: true,
     }
}
})
