import { existsSync } from "node:fs";

for (const path of ["apps/web/.env.local", "apps/web/.env"]) {
  if (existsSync(path)) process.loadEnvFile(path);
}
const base = process.env.API_URL || "https://istagram-web.onrender.com";
const url = new URL("health", `${base.replace(/\/$/, "")}/`);
const started = Date.now();
console.log(`Checking backend: ${url.origin}/health (timeout: 60s)`);
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  const body = await response.json();
  console.log(`HTTP ${response.status}, ${Date.now() - started}ms`);
  console.log(`Status: ${body.status ?? "unknown"}; database: ${body.db ?? "unknown"}; storage: ${body.storage ?? "unknown"}`);
  if (!response.ok || body.status !== "ok") process.exitCode = 1;
} catch (error) {
  console.error(`Backend unavailable: ${error.name} (${error.cause?.code ?? error.message}).`);
  console.error("Check API_URL, your connection, and the backend deployment. A 504 means the frontend waited 60s for the API.");
  process.exitCode = 1;
}
