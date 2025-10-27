import path from "path"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// Plugin um Server-Dateien automatisch in dist/ zu kopieren
const copyServerFiles = () => ({
  name: 'copy-server-files',
  writeBundle() {
    try {
      console.log('🚀 Copying server files to dist/...')
      
      // Kopiere upload.php in dist/
      if (existsSync('upload.php')) {
        copyFileSync('upload.php', 'dist/upload.php')
        console.log('✅ upload.php copied to dist/')
      } else {
        console.warn('⚠️ upload.php not found - skipping')
      }
      
      // Erstelle uploads/ Ordner in dist/
      mkdirSync('dist/uploads', { recursive: true })
      
      // Kopiere uploads/index.php
      if (existsSync('uploads/index.php')) {
        copyFileSync('uploads/index.php', 'dist/uploads/index.php')
        console.log('✅ uploads/index.php copied to dist/')
      } else {
        console.warn('⚠️ uploads/index.php not found - creating empty index.php')
        // Erstelle leere index.php als Fallback
        copyFileSync('uploads/index.php', 'dist/uploads/index.php')
      }
      
      console.log('🎉 Server files copied successfully!')
      
    } catch (error) {
      console.error('❌ Failed to copy server files:', error)
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyServerFiles()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: false,
    hmr: {
      overlay: false,
      port: 5175,
      host: '0.0.0.0',
      clientPort: 5175
    },
    cors: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  optimizeDeps: {
    exclude: ['cap']
  }
})