import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./qa",
  testMatch: "render-readonly.spec.ts",
  outputDir: "test-results/render-readonly",
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 70_000 },
  reporter: "list",
  use: {
    baseURL: process.env.QA_RENDER_WEB_URL ?? "http://localhost:3001",
    headless: true,
    screenshot: "only-on-failure",
  },
});
