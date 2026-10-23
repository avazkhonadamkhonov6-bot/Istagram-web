import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./qa",
  testMatch: "completion.spec.ts",
  outputDir: "test-results/completion",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: "list",
  webServer:
    process.env.QA_START_SERVERS === "1"
      ? [
          {
            command: "pnpm --filter api start",
            cwd: "../..",
            url: "http://127.0.0.1:4400/health",
            timeout: 60_000,
            reuseExistingServer: !process.env.CI,
          },
          {
            command: "pnpm --filter web start --port 3301",
            env: { NODE_ENV: "production" },
            cwd: "../..",
            url: "http://127.0.0.1:3301/login",
            timeout: 60_000,
            reuseExistingServer: !process.env.CI,
          },
        ]
      : undefined,
  use: {
    baseURL: process.env.QA_LIVE_URL ?? "http://127.0.0.1:3301",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
