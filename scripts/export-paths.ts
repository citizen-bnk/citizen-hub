// Writes docs/hub-paths.json: every address the website should redirect to the Hub (new paths plus the old ones they replace).
// The website's MOVED_TO_HUB list is copied from it:   npm run export:paths
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { hubPaths, hubPrefixes } from "../src/platform/registry";
import type { Feature } from "../src/platform/feature";

const dir = path.resolve(import.meta.dirname, "../src/features");
const features: Feature[] = [];
for (const d of readdirSync(dir)) {
  const f = path.join(dir, d, "feature.ts");
  if (existsSync(f)) features.push(((await import(pathToFileURL(f).href)) as { default: Feature }).default);
}
const out = { paths: hubPaths(features), prefixes: hubPrefixes(features) };
writeFileSync(path.resolve(import.meta.dirname, "../docs/hub-paths.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.paths.length} addresses, ${out.prefixes.length} prefixes`);
