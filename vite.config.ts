import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      overlay: false // Deaktiviere Error-Overlay um Extension-Fehler zu vermeiden
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Stelle sicher dass alle Asset-Pfade korrekt sind
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  optimizeDeps: {
    exclude: ['cap'] // Cap-Bibliothek von Optimierung ausschließen
  }
})
