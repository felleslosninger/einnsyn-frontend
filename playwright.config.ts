import { defineConfig, devices } from '@playwright/test';

const gallery = 'http://localhost:3100/playwright/gallery/index.html';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  projects: [
    {
      // Components mounted from their `*.story.tsx` files into the gallery.
      name: 'stories',
      testDir: './src',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: gallery,
        serviceWorkers: 'block',
        reuseContext: true,
      },
    },
  ],
  webServer: {
    command: 'npx vite --config playwright/vite.config.ts',
    url: gallery,
    reuseExistingServer: !process.env.CI,
  },
});
