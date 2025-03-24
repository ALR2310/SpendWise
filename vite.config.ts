import { defineConfig } from 'vite';
import { resolve } from 'path';
import rawPlugin from 'vite-raw-plugin';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    minify: true,
    cssMinify: true,
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
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __GOOGLE_CLIENT_ID__: JSON.stringify(process.env.GOOGLE_CLIENT_ID),
    __GOOGLE_CLIENT_SECRET__: JSON.stringify(process.env.GOOGLE_CLIENT_SECRET),
    __GIT_API_URL__: JSON.stringify(process.env.GIT_API_URL),
    __GIT_ACCESS_TOKEN__: JSON.stringify(process.env.GIT_ACCESS_TOKEN),
  },
  plugins: [
    tailwindcss(),
    rawPlugin({
      fileRegex: /.*\.hbs$/,
    }),
  ],
});
