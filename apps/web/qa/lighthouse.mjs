import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// Lighthouse is a QA-only tool; provide its module path from a temporary install.
const { default: lighthouse } = await import(process.env.LIGHTHOUSE_MODULE);
const base = process.env.QA_LIVE_URL ?? "http://127.0.0.1:3002";
const context = await chromium.launchPersistentContext(
  "/tmp/ig-abubakr-lighthouse-browser",
  {
    headless: true,
    channel: process.env.PW_CHANNEL || undefined,
    args: ["--remote-debugging-port=9223"],
    viewport: { width: 1440, height: 900 },
  },
);
try {
  const page = context.pages()[0];
  await page.goto(`${base}/`);
  if (new URL(page.url()).pathname === "/login") {
    await page.getByLabel("Username", { exact: true }).fill("user1");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(`${base}/`);
  }
  await page.locator("article").first().waitFor();
  await page.screenshot({
    path: "/tmp/instagram-feed-desktop.png",
    fullPage: false,
  });
  const results = [];
  for (const path of ["/", "/user1"]) {
    const result = await lighthouse(
      `${base}${path}`,
      {
        port: 9223,
        onlyCategories: ["performance", "accessibility"],
        disableStorageReset: true,
        logLevel: "error",
      },
      {
        extends: "lighthouse:default",
        settings: {
          formFactor: "desktop",
          screenEmulation: {
            mobile: false,
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            disabled: false,
          },
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0,
          },
        },
      },
    );
    if (!result) throw new Error("No Lighthouse result");
    await writeFile(
      `/tmp/instagram-lighthouse-${path === "/" ? "feed" : "profile"}.json`,
      JSON.stringify(result.lhr, null, 2),
    );
    const audits = result.lhr.audits;
    results.push({
      path,
      performance: result.lhr.categories.performance.score * 100,
      accessibility: result.lhr.categories.accessibility.score * 100,
      lcp: audits["largest-contentful-paint"].numericValue,
      cls: audits["cumulative-layout-shift"].numericValue,
      issues: Object.values(audits)
        .filter(
          (a) => a.score !== null && a.score < 0.9 && a.details?.items?.length,
        )
        .map((a) => ({
          id: a.id,
          title: a.title,
          items: a.details.items.slice(0, 3).map((i) => ({
            selector: i.node?.selector,
            explanation: i.node?.explanation,
          })),
        })),
    });
  }
  console.log(JSON.stringify(results, null, 2));
  await writeFile(
    "/tmp/instagram-lighthouse-summary.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await context.close();
}
