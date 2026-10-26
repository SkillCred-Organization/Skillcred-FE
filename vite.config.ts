import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
  port: 3000,
  strictPort: true,
    proxy: {
      '/api': {
        target: 'https://skillcred-be-development-pmhe.onrender.com',
        changeOrigin: true,
      },
    },
},
})