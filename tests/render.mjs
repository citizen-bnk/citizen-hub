// Opens every Hub screen as every demo role in a real browser (sign-in stubbed, API mocked from each feature's fixtures.ts)
// and checks: it renders, nothing throws, every API call has a fixture, and role gating lets the right roles in and keeps
// the others out.   node --import tsx tests/render.mjs [--feature id] [--shots dir]
import { createRequire } from "node:module";
import { spawn, spawnSync } from "node:child_process";
import { rmSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire("/opt/node-tools/")("playwright");
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
const only = arg("feature");
const shots = arg("shots");
const root = path.resolve(import.meta.dirname, "..");

// The demo accounts (backend/app/libs/demo_seed.py) and the roles each holds.
const ROLES = {
  customer: ["customer"],
  investor: ["investor"],
  shareholder: ["investor", "shareholder"],
  board: ["board_member", "investor"],
  staff: ["staff", "back_office"],
  admin: ["admin", "super_admin"],
  combined: ["customer", "investor", "shareholder", "board_member"],
};

// --- load features and their fixtures
const { pathToFileURL: u } = await import("node:url");
const featureDirs = readdirSync(path.join(root, "src/features")).filter((d) => existsSync(path.join(root, "src/features", d, "feature.ts")));
const features = [];
const fixtures = { "GET /api/platform/demo-accounts": null };
for (const d of featureDirs) {
  // Fixtures of every feature are always loaded (Home shows every feature's tiles); `--feature` limits which screens are visited.
  if (!only || d === only || d === "home") features.push((await import(u(path.join(root, "src/features", d, "feature.ts")).href)).default);
  const fx = path.join(root, "src/features", d, "fixtures.ts");
  if (existsSync(fx)) Object.assign(fixtures, (await import(u(fx).href)).default);
}
const allow = (roles, wanted) => roles.includes("super_admin") || roles.some((r) => wanted.includes(r));
const fill = (p, sample = {}) => p.replace(/:([A-Za-z]+)/g, (_m, k) => sample[k] ?? "x");

// --- match a request to a fixture: "GET /api/meetings/:id" matches /api/meetings/7; `*` matches the rest
const compiled = Object.entries(fixtures).map(([k, v]) => {
  const [method, pat] = k.split(" ");
  const re = new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/:[A-Za-z]+/g, "[^/]+").replace(/\*/g, ".*") + "$");
  return { method, re, v };
});

// --- build and serve the stubbed app on a private output dir so parallel runs never collide
const out = path.join(root, `dist-stub-${process.pid}`);
const build = spawnSync("npx", ["vite", "build", "--outDir", out, "--logLevel", "error"], { cwd: root, env: { ...process.env, HUB_E2E_STUB: "1" }, encoding: "utf8" });
if (build.status !== 0) { console.error(build.stdout + build.stderr); process.exit(1); }
const port = 4300 + (process.pid % 500);
const server = spawn("npx", ["vite", "preview", "--outDir", out, "--port", String(port), "--strictPort"], { cwd: root, stdio: "ignore", env: { ...process.env, HUB_E2E_STUB: "1" } });
for (let i = 0; i < 60; i++) { // wait until the preview server answers
  if (await fetch(`http://localhost:${port}/`).then((r) => r.ok, () => false)) break;
  await new Promise((r) => setTimeout(r, 250));
}
const cleanup = () => { server.kill(); rmSync(out, { recursive: true, force: true }); };
process.on("exit", cleanup);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const problems = [];
let checked = 0;

for (const [who, roles] of Object.entries(ROLES)) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  let current = "";
  const fail = (msg) => problems.push(`[${who}] ${current}: ${msg}`);
  page.on("pageerror", (e) => fail(`page error: ${String(e).split("\n")[0]}`));
  page.on("console", (m) => { if (m.type() === "error" && /Warning: |crashed/.test(m.text())) fail(`console: ${m.text().slice(0, 160)}`); });
  await page.route("**/api/**", (route) => {
    const req = route.request();
    const p = new URL(req.url()).pathname;
    if (p === "/api/roles/my-roles") return route.fulfill({ json: { roles } });
    const hit = compiled.find((c) => c.method === req.method() && c.re.test(p));
    if (!hit) { fail(`no fixture for ${req.method()} ${p}`); return route.fulfill({ status: 404, json: { detail: "no fixture" } }); }
    return route.fulfill({ json: typeof hit.v === "function" ? hit.v(req) : hit.v });
  });

  const visit = async (p, expect) => {
    current = p;
    await page.goto(`http://localhost:${port}${p}`);
    await page.waitForSelector("main, [data-testid=gate-message]", { timeout: 8000 }).catch(() => fail("nothing rendered"));
    await page.waitForTimeout(500);
    const gate = await page.locator("[data-testid=gate-message]").count();
    const crashed = await page.getByText("This screen hit a problem").count();
    if (crashed) fail("screen crashed (error boundary)");
    if (expect === "open" && gate) fail(`should be open for ${who} but is gated: ${(await page.locator("[data-testid=gate-message]").first().innerText({ timeout: 2000 }).catch(() => "?")).replace(/\n+/g, " ").slice(0, 120)}`);
    if (expect === "gated" && !gate) fail(`should be gated for ${who} but rendered`);
    checked++;
    if (shots && expect === "open") { mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${who}${p === "/" ? "-home" : p.replace(/\//g, "-")}.png`), fullPage: true }); }
  };

  for (const f of features) {
    for (const s of f.screens) {
      const wanted = s.roles ?? f.roles;
      await visit(fill(s.path, s.sample), allow(roles, wanted) ? "open" : "gated");
    }
  }
  await ctx.close();
}
await browser.close();
cleanup();

console.log(`checked ${checked} screen visits across ${Object.keys(ROLES).length} roles and ${features.length} features`);
if (problems.length) { console.log([...new Set(problems)].join("\n")); process.exit(1); }
console.log("all screens render, no unmocked API calls, role gating correct");
