import assert from "node:assert/strict";
import { test } from "node:test";
import { workspacesFor } from "../src/hub/workspaces.js";

const labels = (roles: string[]) => workspacesFor(roles).map((d) => d.label);

test("each role opens its own workspaces and nothing else", () => {
  assert.deepEqual(labels(["investor"]), ["My investments"]);
  assert.deepEqual(labels(["shareholder"]), ["My investments"]);
  assert.deepEqual(labels(["board_member"]), ["Board portal"]);
  assert.deepEqual(labels(["staff"]), ["Back office"]);
  assert.deepEqual(labels(["admin"]), ["Administration"]);
  assert.deepEqual(labels(["board_member", "investor"]), ["My investments", "Board portal"]);
});

test("a customer, an unknown role or no role gets no Hub workspace", () => {
  for (const roles of [["customer"], ["root"], [], ["ADMIN"]]) assert.deepEqual(labels(roles), []);
});

test("investor and board workspaces live in the Hub; staff ones still open on the website", () => {
  const all = workspacesFor(["investor", "board_member", "super_admin"]);
  for (const w of all) assert.equal(!!w.external, w.kind === "staff", w.label);
});
