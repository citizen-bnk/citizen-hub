// Renders the Hub screens (stub sign-in build) with fixture API data and saves screenshots: node tests/support/render.mjs
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const { chromium } = createRequire("/opt/node-tools/")("playwright");
const out = process.argv[2] ?? "shots";
const sub = (i, cls, st, paid) => ({ subscription_id: `s${i}`, id: `s${i}`, share_class: cls, num_shares: 1000 * i, total_amount: 50000 * i, amount_paid: paid, amount_remaining: 50000 * i - paid, payment_status: st, status: st, certificate_number: st === "paid" ? "CB-0001" : null, payment_deadline: "2026-12-01T00:00:00Z" });
const fixtures = {
  "roles/my-roles": { roles: ["investor", "board_member"] },
  "my-public-subscriptions": { summary: { total_shares_owned: 3000, total_investment_amount: 150000, active_subscriptions: 2, pending_payments: 1, certificates_issued: 1 }, subscriptions: [sub(1, "A", "paid", 50000), sub(2, "B", "partial", 40000)] },
  "board/dashboard": { profile: { position: "Director", appointed_date: "2026-01-15", term_end_date: "2029-01-14", status: "active", total_shares: 5000, investment_status: { required_shares: 5000, meets_requirement: true, shares_needed: 0, investment_needed: 0 } }, is_chair: false, document_summary: { total_required: 6, approved: 4, pending_review: 1, needs_action: 1, critical_missing: 0, expiring_soon: 1, completion_percentage: 67 }, next_meeting: { id: "m1", title: "Q4 Board Meeting", meeting_date: "2026-11-20", meeting_time: "09:00:00", location: "Maseru", meeting_type: "regular", virtual_link: "https://meet.example.test/q4" } },
};
const server = spawn("npx", ["vite", "preview", "--outDir", "dist-stub", "--port", "4177"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((t) => localStorage.setItem("citizenhub-hub-ui-theme", t), theme);
  const page = await ctx.newPage();
  const bad = [];
  page.on("pageerror", (e) => bad.push(String(e)));
  await page.route("**/api/**", (route) => {
    const u = route.request().url();
    const hit = Object.keys(fixtures).find((k) => u.includes(k));
    if (!hit) bad.push("unmocked " + u);
    return route.fulfill({ json: hit ? fixtures[hit] : [] });
  });
  for (const p of ["/", "/my-subscriptions", "/board-portal", "/board-documents", "/board-meetings"]) {
    await page.goto("http://localhost:4177" + p);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${theme}${p === "/" ? "-home" : p.replace("/", "-")}.png`, fullPage: true });
  }
  console.log(theme, bad.length ? [...new Set(bad)].slice(0, 12) : "no errors");
  await ctx.close();
}
await browser.close();
server.kill();
