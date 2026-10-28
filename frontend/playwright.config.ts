import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a production build on port 3110.
 *  - default: mock backend (NEXT_PUBLIC_USE_MOCKS=true), no network needed
 *  - E2E_REAL=1: the real FastAPI backend at BACKEND_URL (default http://127.0.0.1:8000, start it with
 *    `cd backend && make fixture && make run-fixture`), exercised through the Next.js /api rewrite
 */
const real = process.env.E2E_REAL === "1";
const env = {
  NEXT_PUBLIC_USE_MOCKS: real ? "false" : "true",
  BACKEND_URL: process.env.BACKEND_URL ?? "http://127.0.0.1:8000",
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3110", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } }, grep: /@mobile/ },
  ],
  webServer: {
    command: "npx next build && npx next start -p 3110",
    url: "http://127.0.0.1:3110",
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env,
  },
});
