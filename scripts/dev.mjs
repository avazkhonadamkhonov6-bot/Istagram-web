// `npm run dev` — vebi Next.js zud:
// 1. bidun `npx pnpm` (har bor registry-ro tekshir mekard) — `next` az apps/web/node_modules;
// 2. bidun build-i @repo/shared — veb onro az src mexonad (tsconfig paths + transpilePackages);
// 3. pas az ogoz sahifahoi asosi pesh-az-vaqt kompilyatsiya meshavand, to click-i avval intizor naboshad.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const web = join(import.meta.dirname, "..", "apps", "web");
const bin = join(web, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(bin)) {
  console.error("Next.js nasb nashudaast. Avval ijro kuned: npx pnpm@10.34.7 install");
  process.exit(1);
}

const port = process.env.PORT ?? "3000";
// Bevosita bo node (bidun shell): dar Windows ham argumentho bexatar
const child = spawn(process.execPath, [bin, "dev", "-p", port, ...process.argv.slice(2)], {
  cwd: web,
  stdio: ["inherit", "pipe", "inherit"],
});

const WARM = ["/login", "/", "/explore", "/reels", "/direct/inbox", "/accounts/edit"];
let warmed = false;

async function warmUp() {
  const base = `http://localhost:${port}`;
  const started = Date.now();
  // Paralel ne: Turbopack sahifahoro yak-yak tez kompilyatsiya mekunad, CPU band nameshavad
  for (const path of WARM) {
    try {
      // Cookie-i soxta: proxy ba /login namefiristad va kodi sahifa kompilyatsiya meshavad (API 401 megardonad)
      await fetch(base + path, {
        redirect: "manual",
        headers: { cookie: "access_token=dev-warmup" },
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      // sahifa xato dod — kompilyatsiya baroi click-i avval baroboq ham foyda dorad
    }
  }
  console.log(`\n  Sahifahoi asosi tayyor (${((Date.now() - started) / 1000).toFixed(1)} s): ${base}\n`);
}

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  if (!warmed && /Ready in|ready started|Local:/i.test(chunk.toString())) {
    warmed = true;
    void warmUp();
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
