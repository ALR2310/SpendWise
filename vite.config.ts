import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify'

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
   },
   plugins: [
      ViteMinifyPlugin({})
   ]
});
