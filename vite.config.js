import { defineConfig } from 'vite';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { renderHtml } from './scripts/render-content.js';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * Writes the content of src/config.js (and responsive image data) into the
 * HTML at build/serve time, so the page works without JavaScript.
 * Config is re-imported on every request in dev, so edits show on refresh.
 */
function contentFromConfig() {
  return {
    name: 'lmdc-content-from-config',
    transformIndexHtml: {
      order: 'pre', // fill content before Vite processes the HTML
      async handler(html) {
      const url = `${pathToFileURL(resolve(root, 'src/config.js')).href}?t=${Date.now()}`;
      const { default: config } = await import(url);
      const manifestPath = resolve(root, 'src/generated/images.json');
      const images = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
      return renderHtml(html, config, images);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('src/config.js') || file.endsWith('images.json')) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  plugins: [contentFromConfig()],
  build: {
    outDir: 'dist',
    sourcemap: true, // readable stack traces in Vercel logs / DevTools
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600, // three.js is lazy-loaded in its own chunk
    rolldownOptions: {
      // Multi-page build so 404.html is emitted to dist/ (Vercel serves it for unknown routes)
      input: {
        main: resolve(root, 'index.html'),
        notFound: resolve(root, '404.html'),
      },
    },
  },
});
