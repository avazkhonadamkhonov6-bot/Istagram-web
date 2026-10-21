import { defineConfig } from "@playwright/test";
export default defineConfig({
  outputDir: "test-results/live",
  testDir: "./qa",
  testMatch: "abubakr-live.spec.ts",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: process.env.QA_LIVE_URL ?? "http://127.0.0.1:3001",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
