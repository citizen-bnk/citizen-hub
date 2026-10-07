import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { hubPaths, hubPrefixes } from "../src/platform/registry";
import type { Feature } from "../src/platform/feature";

const root = path.resolve(import.meta.dirname, "..");
function* files(dir: string): Generator<string> {
  for (const n of readdirSync(dir)) {
    const f = path.join(dir, n);
    if (statSync(f).isDirectory()) yield* files(f);
    else if (/\.tsx?$/.test(n)) yield f;
  }
}
const featureDirs = readdirSync(path.join(root, "src/features")).filter((d) => existsSync(path.join(root, "src/features", d, "feature.ts")));

test("the source tree is only the new structure (nothing from the old copied Hub creeps back)", () => {
  // Untracked empty folders are ignored. src/app/analytics is the last piece of the old Hub, awaiting its removal.
  const tracked = execSync("git ls-files src", { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  const top = [...new Set(tracked.map((f) => f.split("/")[1]))].filter((n) => n !== "app").sort();
  assert.ok(tracked.every((f) => !f.startsWith("src/app/") || f === "src/app/analytics/index.ts"), "old code under src/app");
  assert.deepEqual(top, ["App.tsx", "components", "features", "index.css", "lib", "main.tsx", "platform", "vite-env.d.ts"]);
});

test("features never import other features", () => {
  const bad: string[] = [];
  for (const d of featureDirs) {
    for (const f of files(path.join(root, "src/features", d))) {
      for (const m of readFileSync(f, "utf8").matchAll(/from\s+["'](?:@\/features\/([\w-]+)|\.\.\/(?:\.\.\/)+([\w-]+)\/)/g)) {
        const other = m[1] ?? m[2];
        if (other && other !== d && featureDirs.includes(other)) bad.push(`${path.relative(root, f)} imports ${other}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("screens report errors through the platform, not their own try/catch, toast or console output", () => {
  const bad: string[] = [];
  for (const d of featureDirs) {
    for (const f of files(path.join(root, "src/features", d))) {
      if (/\.test\.ts$|fixtures\.ts$/.test(f)) continue;
      const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
      for (const re of [/\btry\s*\{/, /(^|[^.\w])catch\s*\(/m, /toast\.(error|success|warning|info)/, /console\.(error|log|warn)/, /\balert\(/]) {
        if (re.test(src)) bad.push(`${path.relative(root, f)}: ${re}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("every screen file is a default export and every feature declares at least one screen", () => {
  for (const d of featureDirs) {
    const src = readFileSync(path.join(root, "src/features", d, "feature.ts"), "utf8");
    assert.match(src, /defineFeature\(/, d);
    for (const m of src.matchAll(/import\(["'](\.\/[^"']+)["']\)/g)) {
      const base = path.join(root, "src/features", d, m[1]);
      const file = [".tsx", ".ts"].map((e) => base + e).find(existsSync);
      assert.ok(file, `${d}: ${m[1]} does not exist`);
      assert.match(readFileSync(file!, "utf8"), /export default/, `${d}: ${m[1]} has no default export`);
    }
  }
});

test("docs/hub-paths.json (what the website redirects) matches the features", async () => {
  const features: Feature[] = [];
  for (const d of featureDirs) features.push(((await import(pathToFileURL(path.join(root, "src/features", d, "feature.ts")).href)) as { default: Feature }).default);
  const onDisk = JSON.parse(readFileSync(path.join(root, "docs/hub-paths.json"), "utf8"));
  assert.deepEqual(onDisk, { paths: hubPaths(features), prefixes: hubPrefixes(features) }, "run `npm run export:paths`");
});

test("no two screens share an address", async () => {
  const seen = new Map<string, string>();
  for (const d of featureDirs) {
    const f = ((await import(pathToFileURL(path.join(root, "src/features", d, "feature.ts")).href)) as { default: Feature }).default;
    for (const s of f.screens) {
      assert.ok(!seen.has(s.path), `${s.path} is in both ${seen.get(s.path)} and ${d}`);
      seen.set(s.path, d);
    }
  }
});
