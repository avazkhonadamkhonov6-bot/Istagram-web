import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const css = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);
const spec = readFileSync(
  new URL("../../../docs/specs/10-frontend-dizayn.md", import.meta.url),
  "utf8",
);
const light = css.match(/:root,\s*\.__ig-light-mode\s*\{([\s\S]*?)\n\}/)?.[1];
const dark = css.match(/\.dark,\s*\.__ig-dark-mode\s*\{([\s\S]*?)\n\}/)?.[1];
assert(light && dark, "Both theme blocks must exist");
const normal = (value) =>
  value.replace(/\s/g, "").replace(/\b0\./g, ".").toLowerCase();
function expected(value) {
  const hex = value.match(/#([0-9a-f]{6})/i)?.[1];
  if (hex)
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
  const rgba = value.match(/rgba\([^)]+\)/)?.[0];
  if (rgba) return value.match(/`([^`]+)`/)?.[1] ?? rgba;
  return undefined;
}
let checks = 0;
for (const row of spec.split("\n").filter((line) => line.startsWith("| `--"))) {
  const cells = row.split("|");
  const name = cells[1].match(/`(--[^`]+)`/)?.[1];
  const primary = expected(cells[2] ?? "");
  if (!name || !primary) continue;
  const secondary = expected(cells[3] ?? "") ?? primary;
  const regexp = new RegExp(
    `${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([^;]+);`,
  );
  for (const [mode, block, want] of [
    ["light", light, primary],
    ["dark", dark, secondary],
  ]) {
    const actual = block.match(regexp)?.[1] ?? light.match(regexp)?.[1];
    assert(actual, `${name} is missing in ${mode}`);
    assert.equal(normal(actual), normal(want), `${mode}: ${name}`);
    checks++;
  }
}
for (const token of [
  "--ig-brand-gradient",
  "--ig-animation-move-in",
  "--ig-animation-move-out",
  "--fds-animation-enter-exit-in",
  "--ig-duration-extra-extra-short-in",
]) {
  assert(css.includes(`${token}:`), token);
  checks++;
}
console.log(`Design tokens: ${checks} checks passed against Spec 10.`);
