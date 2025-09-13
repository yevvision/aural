import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false, // Erlaube andere Ports wenn 5173 belegt ist
    hmr: {
      overlay: false, // Deaktiviere Error-Overlay um Extension-Fehler zu vermeiden
      clientPort: 5173
    },
    cors: true, // Aktiviere CORS für bessere Kompatibilität
        headers: {
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
          'Cross-Origin-Opener-Policy': 'unsafe-none',
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' ws: wss: blob: data: http://localhost:*; font-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self';"
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
