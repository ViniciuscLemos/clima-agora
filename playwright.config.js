// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// End to end tests: a real browser on the built front end (npm run build first).
// The API is mocked in the tests with page.route, so they don't need the internet
// or an OpenWeather key.
const PORT = 4330;
const URL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: URL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ].map((project) => ({
    ...project,
    // locally it uses the Edge that is already installed instead of downloading Chromium
    use: { ...project.use, channel: process.env.CI ? undefined : 'msedge' },
  })),
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    cwd: 'web',
    url: URL,
    reuseExistingServer: false,
  },
});
