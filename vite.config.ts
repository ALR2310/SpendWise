import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import { version } from './package.json';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: false,
    cssMinify: false,
    emptyOutDir: true,
    rollupOptions: {
      external: ['jeep-sqlite'],
      input: {
        index: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: { port: 8100 },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: './src/assets/sql-wasm.wasm',
          dest: 'assets',
        },
      ],
    }),
  ],
});
