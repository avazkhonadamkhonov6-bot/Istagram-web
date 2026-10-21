import { defineConfig } from "@playwright/test";

/**
 * FE-21: 5 senariyai asosi (TZ §6.4) — register, post, like, follow, direct.
 * Talab: PostgreSQL bo migratsiya + seed (`pnpm --filter api db:deploy && pnpm --filter api db:seed`).
 * Ijro: `pnpm --filter web test:e2e` (api va web xud ba kor medaroyand, agar hanuz kor nakunand).
 * Brauzer: Chrome-i nasbshuda (PW_CHANNEL=msedge baroi Edge).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    channel: process.env.PW_CHANNEL ?? "chrome",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter api start",
      url: "http://localhost:4000/health",
      reuseExistingServer: true,
      cwd: "../..",
      timeout: 60_000,
    },
    {
      command: "pnpm --filter web dev",
      // 401 bidun cookie — server tayyor ast
      url: "http://localhost:3000/api/realtime/ticket",
      reuseExistingServer: true,
      cwd: "../..",
      timeout: 120_000,
    },
  ],
});
