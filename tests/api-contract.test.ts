import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Every backend call a feature makes must name a route the backend really serves. tests/backend-routes.json is a snapshot of
 * the backend's routes ([method, path, operationId]); calls are found by scanning for api.get/post/put/patch/delete/file with a
 * literal path, which is why features write paths as literals (template literals with ${} for ids).
 */
const routes = (JSON.parse(readFileSync(path.join(import.meta.dirname, "backend-routes.json"), "utf8")) as [string, string, string][]).map(
  ([m, p]) => `${m} ${p.replace(/^\/api/, "").replace(/\{[^}]+\}/g, "{}")}`,
);
const served = new Set(routes);

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* files(full);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && name !== "fixtures.ts") yield full;
  }
}

const VERB: Record<string, string> = { get: "GET", post: "POST", put: "PUT", patch: "PATCH", delete: "DELETE", file: "GET" };
const CALL = /\bapi\.(get|post|put|patch|delete|file)\s*(?:<[^()]*>)?\s*\(\s*([`"'])(\/[^`"']*)\2/g;

const calls: { where: string; key: string }[] = [];
for (const root of ["src/features", "src/platform"]) {
  for (const f of files(path.join(import.meta.dirname, "..", root))) {
    const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1"); // examples in comments are not calls
    for (const m of src.matchAll(CALL)) {
      const p = m[3].split("?")[0].replace(/\$\{[^}]*\}/g, "{}");
      calls.push({ where: path.relative(process.cwd(), f), key: `${VERB[m[1]]} ${p}` });
    }
  }
}

test("every literal backend call names a route the backend serves", () => {
  const missing = calls.filter((c) => !served.has(c.key)).map((c) => `${c.where}: ${c.key}`);
  assert.deepEqual([...new Set(missing)], [], "calls to routes that do not exist on the backend");
});
