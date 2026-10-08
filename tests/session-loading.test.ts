import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { SessionBoundary } from "../src/platform/ui/ApplicationBoundary";

test("an unresolved authentication session renders a loading state and resumes without a root error", async () => {
  let ready = false;
  let release!: () => void;
  const session = new Promise<void>((resolve) => { release = () => { ready = true; resolve(); }; });
  function Authentication() {
    if (!ready) throw session;
    return createElement("h1", null, "Investor workspace");
  }
  const errors: unknown[] = [];
  const output = new PassThrough();
  let html = "";
  output.on("data", (chunk) => { html += chunk.toString(); });
  const completed = new Promise<void>((resolve) => output.on("end", resolve));
  const stream = renderToPipeableStream(createElement(SessionBoundary, null, createElement(Authentication)), {
    onShellReady() { stream.pipe(output); },
    onError(error) { errors.push(error); },
  });
  await new Promise<void>((resolve) => output.once("data", () => resolve()));
  assert.match(html, /Opening Citizen Hub securely/);
  assert.doesNotMatch(html, /Investor workspace/);
  release();
  await completed;
  assert.match(html, /Investor workspace/);
  assert.deepEqual(errors, []);
});
