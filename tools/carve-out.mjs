#!/usr/bin/env node
/**
 * Moves screens from the website into the Hub: copies the listed pages and everything they import (the shared
 * foundation: generated API client, auth, theme, UI kit, utilities), keeping the same paths so the code is unchanged,
 * then lays the Hub's own files (tools/overrides) on top. Safe to re-run; run it again after adding a page to the config.
 *
 *   node tools/carve-out.mjs ../CitizenBankWebsite
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const website = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(path.join(website, "src", "pages"))) {
  console.error("Usage: node tools/carve-out.mjs <path to the website checkout>");
  process.exit(2);
}
const hub = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(fs.readFileSync(path.join(hub, "tools", "carve-out.config.json"), "utf8"));
const SRC = path.join(website, "src");
const isHubOwned = (rel) => cfg.hubOwned.some((p) => (p.endsWith("/") ? rel.replaceAll("\\", "/").startsWith(p) : rel.replaceAll("\\", "/") === p));

const exts = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];
// Same order Vite uses (first match wins): "@/" is src/, so "@/components/ui/x" is src/components/ui/x. The shadcn
// extension folders are only a fallback for imports that the website itself maps there.
const alias = [
  ["@/", ""], ["components/", "components/"], ["pages/", "pages/"], ["app/", "app/"], ["utils/", "utils/"],
  ["@/components/ui/", "extensions/shadcn/components/"], ["@/components/hooks/", "extensions/shadcn/hooks/"], ["@/hooks/", "extensions/shadcn/hooks/"],
];
function resolveImport(from, spec) {
  let base = null;
  if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else if (spec === "app") base = path.join(SRC, "app");
  else if (spec === "brain") base = path.join(SRC, "brain");
  else if (spec === "types") base = path.join(SRC, "apiclient/data-contracts");
  else {
    for (const [p, t] of alias) {
      if (!spec.startsWith(p)) continue;
      const candidate = path.join(SRC, t + spec.slice(p.length));
      for (const e of exts) { const f = candidate + e; if (fs.existsSync(f) && fs.statSync(f).isFile()) return f; }
    }
    return null;
  }
  for (const e of exts) { const f = base + e; if (fs.existsSync(f) && fs.statSync(f).isFile()) return f; }
  return null;
}

const files = new Set(); const external = new Set(); const skippedByOverride = [];
function walk(f) {
  const rel = path.relative(SRC, f);
  if (files.has(f)) return;
  if (isHubOwned(rel)) { skippedByOverride.push(rel); return; } // the Hub has its own version; do not copy or follow it
  files.add(f);
  if (!/\.(tsx?|jsx?)$/.test(f)) return;
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/(?:import|export)\s[^'"]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g)) {
    const spec = m[1] || m[2] || m[3]; const r = resolveImport(f, spec);
    if (r) walk(r); else if (!spec.startsWith(".")) { const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]; if (/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) external.add(name); }
  }
}
const addFile = (rel) => { const f = path.join(SRC, rel); if (fs.existsSync(f)) walk(f); else console.warn("missing in website:", rel); };
const addDir = (rel) => { (function r(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? r(p) : walk(p); } })(path.join(SRC, rel)); };

// the Hub's own files import shared code too (for example the header uses the notification bell): follow those imports
// without copying the Hub's files themselves
function followOwned() {
  const roots = cfg.hubOwned.map((p) => path.join(hub, "src", p));
  const visit = (p) => {
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).forEach((n) => visit(path.join(p, n)));
    if (!/\.(tsx?|jsx?)$/.test(p)) return;
    const s = fs.readFileSync(p, "utf8");
    for (const m of s.matchAll(/(?:import|export)\s[^'"]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g)) {
      const spec = m[1] || m[2] || m[3]; const r = resolveImport(path.join(SRC, path.relative(path.join(hub, "src"), p)), spec); // relative imports resolve as if the file sat in the website
      if (r) walk(r); else if (!spec.startsWith(".")) { const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]; if (/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) external.add(name); }
    }
  };
  roots.forEach(visit);
}
cfg.pages.forEach((p) => addFile(`pages/${p}.tsx`));
followOwned();
cfg.base.forEach(addFile); cfg.wholeDirs.forEach(addDir); cfg.wholeFiles.forEach(addFile);

// the generated API client is one big module; keep it whole so any later page works
addDir("apiclient");

// replace what a previous run copied (tracked in the manifest), never the Hub's own files
const manifestPath = path.join(hub, "tools", "carve-out.manifest.json");
const target = path.join(hub, "src");
if (fs.existsSync(manifestPath)) for (const rel of JSON.parse(fs.readFileSync(manifestPath, "utf8"))) if (!isHubOwned(rel)) fs.rmSync(path.join(target, rel), { force: true }); // never a Hub-owned file, even if an old manifest lists it
const manifest = [];
for (const f of files) { const rel = path.relative(SRC, f); const out = path.join(target, rel); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.copyFileSync(f, out); manifest.push(rel); }
fs.writeFileSync(manifestPath, JSON.stringify(manifest.sort(), null, 2) + "\n");
for (const r of cfg.rootFiles) { const from = path.join(website, r); if (fs.existsSync(from)) fs.copyFileSync(from, path.join(hub, r)); }
fs.cpSync(path.join(website, cfg.publicDir), path.join(hub, "public"), { recursive: true });
const copied = manifest.length, over = 0;

fs.writeFileSync(path.join(hub, "tools", "carve-out.packages.json"), JSON.stringify([...external].sort(), null, 2) + "\n");
console.log(`copied ${copied} source files; ${external.size} npm packages are used (tools/carve-out.packages.json)`);
if (skippedByOverride.length) console.log("not followed (the Hub has its own):", [...new Set(skippedByOverride)].join(", "));
