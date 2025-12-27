import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // === BUILD OPTIMIZATION ===
  build: {
    // Slightly bump warning limit (we're optimizing, but some chunks may be close)
    chunkSizeWarningLimit: 600,

    // Rollup options for chunk splitting
    rollupOptions: {
      output: {
        // Aggressive code splitting for faster initial load
        manualChunks: {
          // Core React runtime (rarely changes, cached long-term)
          'vendor-react': ['react', 'react-dom'],

          // UI/Animation libraries
          'vendor-ui': ['framer-motion', 'lucide-react', 'react-textarea-autosize'],

          // Markdown processing
          'vendor-markdown': ['react-markdown', 'remark-gfm'],

          // HTTP client
          'vendor-axios': ['axios'],
        },

        // Optimize chunk file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Minification settings
    minify: 'esbuild',

    // Generate source maps for production debugging (optional)
    sourcemap: false,

    // Target modern browsers for smaller output
    target: 'es2020',
  },

  // === DEV SERVER ===
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },

  // === PREVIEW SERVER ===
  preview: {
    port: 4173,
  },
})
