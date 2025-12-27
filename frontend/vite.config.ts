import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    open: false,
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: [
      'spice-road-mvp-frontend-dev-gpxy5envpq-dt.a.run.app',
      'spice-road-mvp-frontend-dev-229280098957.asia-northeast2.run.app',
      '.run.app',
    ],
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      polyfill: true,
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'leaflet', 'chart.js'],
  },
});
