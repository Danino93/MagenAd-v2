import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import compression from 'vite-plugin-compression' // Commented out - might cause issues

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Compression plugins - uncomment for production build
    // compression({
    //   algorithm: 'gzip',
    //   ext: '.gz'
    // }),
    // compression({
    //   algorithm: 'brotliCompress',
    //   ext: '.br'
    // })
  ],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'forms': ['react-hook-form'],
          'ui': ['lucide-react']
        }
      }
    },
    // Minification - use 'esbuild' for faster builds, 'terser' for production
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    terserOptions: process.env.NODE_ENV === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    } : {},
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  // Image optimization
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
