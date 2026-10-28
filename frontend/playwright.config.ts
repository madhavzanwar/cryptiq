import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against PRODUCTION builds, never `next dev`.
 *
 *  default      REAL stack: the FastAPI backend on its synthetic fixture (scripts/e2e-backend.sh, port 8101, fresh ledger
 *               and cache on every start) + `next build && next start` on port 3110 proxying /api/* to it.
 *  E2E_MOCKS=1  the built-in mock backend (NEXT_PUBLIC_USE_MOCKS=true), no Python needed.
 *
 * retries stay 0: a flaky test is a bug to fix, not to hide. One worker, because the fixture backend keeps an
 * in-process 10-minute check cache per address, so each test uses wallets nobody else touched (see helpers.ts).
 */
export const MOCKS = process.env.E2E_MOCKS === "1";
const BACKEND_PORT = 8101;
const FRONTEND_PORT = 3110;

const frontendEnv = {
  NEXT_PUBLIC_USE_MOCKS: MOCKS ? "true" : "false",
  BACKEND_URL: `http://127.0.0.1:${BACKEND_PORT}`,
  NEXT_DIST_DIR: MOCKS ? ".next-e2e-mock" : ".next-e2e",
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    permissions: ["microphone"],
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } }, grep: /@mobile/ },
  ],
  webServer: [
    ...(MOCKS
      ? []
      : [
          {
            command: `BACKEND_PORT=${BACKEND_PORT} bash scripts/e2e-backend.sh`,
            url: `http://127.0.0.1:${BACKEND_PORT}/api/health`,
            timeout: 300_000, // the first run may have to build the synthetic fixture
            reuseExistingServer: false, // always a fresh backend: empty ledger, sessions and cache
            stdout: "ignore" as const,
            stderr: "pipe" as const,
          },
        ]),
    {
      command: "npx next build && npx next start -p " + FRONTEND_PORT,
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: frontendEnv,
      stdout: "ignore" as const,
      stderr: "pipe" as const,
    },
  ],
});
