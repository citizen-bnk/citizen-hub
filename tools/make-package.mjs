#!/usr/bin/env node
/** Writes package.json's dependencies from tools/carve-out.packages.json, using the website's exact versions. */
import fs from "node:fs";
import path from "node:path";
const website = path.resolve(process.argv[2] || "");
const web = JSON.parse(fs.readFileSync(path.join(website, "package.json"), "utf8"));
const need = JSON.parse(fs.readFileSync("tools/carve-out.packages.json", "utf8"));
const all = { ...web.devDependencies, ...web.dependencies };
const dep = {};
for (const n of need) {
  if (n === "@citizen-bnk/platform") dep[n] = "github:citizen-bnk/citizen-platform";
  else if (all[n]) dep[n] = all[n];
  else if (n === "lucide-react") dep[n] = "^" + JSON.parse(fs.readFileSync(path.join(website, "node_modules/lucide-react/package.json"), "utf8")).version; // the website imports it without declaring it
  else console.warn("not in the website's package.json:", n);
}
const tooling = ["vite", "@vitejs/plugin-react", "dotenv", "vite-plugin-html-inject", "vite-tsconfig-paths", "tailwindcss", "postcss", "autoprefixer",
  "typescript", "tailwindcss-animate", "@types/react", "@types/react-dom", "@types/node", "tsx"];
const dev = Object.fromEntries(tooling.map((n) => [n, all[n]]));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.dependencies = Object.fromEntries(Object.entries(dep).sort());
pkg.devDependencies = Object.fromEntries(Object.entries(dev).sort());
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log(Object.keys(dep).length, "dependencies,", Object.keys(dev).length, "dev dependencies");
