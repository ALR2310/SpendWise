import { defineConfig } from 'vite';
import { resolve } from 'path';
import handlebars from 'vite-plugin-handlebars';
import rawPlugin from 'vite-raw-plugin';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    minify: false,
    cssMinify: false,
    emptyOutDir: true,
    rollupOptions: {
      external: ['jeep-sqlite'],
      input: {
        index: resolve(__dirname, 'src', 'index.html'),
      },
    },
  },
  server: {
    port: 8181,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  define: { global: 'window', __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    tailwindcss(),
    rawPlugin({
      fileRegex: /.*\.hbs$/,
    }),
    // @ts-ignore
    handlebars({
      // @ts-ignore
      partialDirectory: resolve(__dirname, 'src', 'clients', 'partials'),
    }),
  ],
});
