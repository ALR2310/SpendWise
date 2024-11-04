import { defineConfig } from 'vite';

export default defineConfig({
   root: 'www',
   build: {
      outDir: '../dist',
      minify: false,
      emptyOutDir: true,
      rollupOptions: {
         external: ['jeep-sqlite']
      }
   },
   server: {
      port: 8100
   }
});
