import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POLICY } from "./defaults";
import { listLabel, listOptions, resolvePolicy } from "./logic";

test("no response, or rubbish, gives the defaults", () => {
  for (const raw of [undefined, null, "x", 5, [], {}, { policies: "no", plans: 3, lists: [] }]) assert.deepEqual(resolvePolicy(raw), DEFAULT_POLICY);
});

test("valid keys replace the defaults, invalid ones fall back one by one", () => {
  const s = resolvePolicy({
    version: 7,
    policies: { "legal.footer": "New footer", "app.base_currency": "zar", "payments.reminder_days": [5, 2], "legal.licence_status": 42, "invitations.expiry_days": { board: "x" }, "unknown.key": 1 },
  });
  assert.equal(s.version, 7);
  assert.equal(s.policies["legal.footer"], "New footer");
  assert.equal(s.policies["app.base_currency"], "ZAR");
  assert.deepEqual(s.policies["payments.reminder_days"], [5, 2]);
  assert.equal(s.policies["legal.licence_status"], DEFAULT_POLICY.policies["legal.licence_status"]);
  assert.deepEqual(s.policies["invitations.expiry_days"], DEFAULT_POLICY.policies["invitations.expiry_days"]);
  assert.ok(!("unknown.key" in s.policies));
});

test("null is a valid value for the optional contact keys, and an empty string is not", () => {
  assert.equal(resolvePolicy({ policies: { "careers.apply_email": "jobs@example.com" } }).policies["careers.apply_email"], "jobs@example.com");
  assert.equal(resolvePolicy({ policies: { "careers.apply_email": "nope" } }).policies["careers.apply_email"], null);
  assert.equal(resolvePolicy({ policies: { "legal.footer": "  " } }).policies["legal.footer"], DEFAULT_POLICY.policies["legal.footer"]);
});

test("plans are sorted, bad ones dropped, and an empty or invalid list keeps the defaults", () => {
  const s = resolvePolicy({ plans: [{ code: "b", label: "Two", months: 2, display_order: 2 }, { code: "a", label: "One", months: 1, display_order: 1 }, { code: "x", label: "Bad", months: 0 }, 7] });
  assert.deepEqual(s.plans.map((p) => p.code), ["a", "b"]);
  assert.deepEqual(resolvePolicy({ plans: [{ code: "x" }] }).plans, DEFAULT_POLICY.plans);
});

test("lists replace only the lists that arrive with valid items", () => {
  const s = resolvePolicy({ lists: { gender: [{ code: "m", label: "M", display_order: 2 }, { code: "f", label: "F", display_order: 1 }], investor_type: [], marital: [{ code: "s", label: "Single" }] } });
  assert.deepEqual(listOptions(s, "gender"), [["f", "F"], ["m", "M"]]);
  assert.deepEqual(s.lists.investor_type, DEFAULT_POLICY.lists.investor_type);
  assert.deepEqual(listOptions(s, "marital"), [["s", "Single"]]);
  assert.deepEqual(listOptions(s, "nothing"), []);
  assert.equal(listLabel(s, "gender", "f"), "F");
  assert.equal(listLabel(s, "gender", "zz"), "zz");
});

test("the defaults hold today's wording", () => {
  assert.match(DEFAULT_POLICY.policies["legal.footer"], /applicant for a banking licence/);
  assert.equal(DEFAULT_POLICY.policies["app.base_currency"], "LSL");
  assert.deepEqual(DEFAULT_POLICY.plans.map((p) => p.months), [1, 3, 6, 12]);
});
