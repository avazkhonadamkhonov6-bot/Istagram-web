import { defineConfig } from "@playwright/test";

// QA-02 is independent of Avaz's API/Direct end-to-end suite.
// Start web with NEXT_PUBLIC_API_MOCKING=on before running this config.
export default defineConfig({
  outputDir: "test-results/mock",
  testDir: "./qa",
  testMatch: ["abubakr.spec.ts", "render-integration.spec.ts"],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.QA_BASE_URL ?? "http://127.0.0.1:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
});
