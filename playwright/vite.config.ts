import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The app runs on Next, so this server exists only to serve the story gallery
// that the component tests in `playwright.config.ts` mount stories from.
const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root,
  resolve: {
    alias: [{ find: /^~\//, replacement: `${root}src/` }],
  },
  server: {
    port: 3100,
    strictPort: true,
  },
});
