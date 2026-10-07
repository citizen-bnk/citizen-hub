import { test } from "node:test";
import assert from "node:assert/strict";
import { positionCode, positionOptions, appointSchema, assignSchema, docState, fieldErrors, filterMembers, investmentState, needsLink, positionSchema, sharesLine, termDaysLeft, termWords } from "./logic";

const m = (over: Record<string, unknown> = {}) => ({
  user_id: "u1", full_name: "Palesa Mokoena", email: "palesa@example.com", position_name: "Chairman", status: "active",
  investment_status: { meets_requirement: true }, document_compliance: { compliance_percentage: 100 }, ...over,
});

test("investment and document states", () => {
  assert.equal(investmentState(m()), "met");
  assert.equal(investmentState(m({ investment_status: { meets_requirement: false } })), "short");
  assert.equal(investmentState(m({ investment_status: null })), "none");
  assert.equal(docState(m({ document_compliance: { compliance_percentage: 40 } })), "partial");
  assert.equal(docState(m({ document_compliance: null })), "unknown");
});

test("placeholder user ids need an account link", () => {
  assert.equal(needsLink({ user_id: "pending_12" }), true);
  assert.equal(needsLink({ user_id: null }), true);
  assert.equal(needsLink({ user_id: "u1" }), false);
  assert.equal(needsLink({ user_id: "u1", email: "A@B.C" }, new Set(["a@b.c"])), true);
});

test("filters and search", () => {
  const rows = [m(), m({ user_id: "pending_2", full_name: "Thabo", position_name: "Treasurer", email: "t@x.com", status: "inactive", investment_status: { meets_requirement: false }, document_compliance: { compliance_percentage: 0 } })];
  assert.equal(filterMembers(rows, "all", "").length, 2);
  assert.deepEqual(filterMembers(rows, "link", "").map((r) => r.full_name), ["Thabo"]);
  assert.equal(filterMembers(rows, "shares", "").length, 1);
  assert.equal(filterMembers(rows, "docs", "").length, 1);
  assert.equal(filterMembers(rows, "inactive", "").length, 1);
  assert.equal(filterMembers(rows, "all", "chair").length, 1);
});

test("term wording", () => {
  const now = new Date("2026-10-01T00:00:00Z");
  assert.equal(termDaysLeft(null, now), null);
  assert.equal(termDaysLeft("2026-10-11", now), 10);
  assert.equal(termWords(10), "10 days left");
  assert.equal(termWords(200), "7 months left");
  assert.equal(termWords(-3), "Ended 3 days ago");
  assert.equal(termWords(null), "No end date");
});

test("appoint validation", () => {
  const bad = appointSchema.safeParse({ user_id: "", position: "", term_years: 9 });
  assert.equal(bad.success, false);
  if (!bad.success) assert.deepEqual(Object.keys(fieldErrors(bad.error)).sort(), ["position", "term_years", "user_id"]);
  assert.equal(appointSchema.parse({ user_id: "u1", position: "director", term_years: "3" }).term_years, 3);
});

test("position and assignment validation", () => {
  assert.equal(positionSchema.safeParse({ position_name: "Chair", position_level: "0" }).success, false);
  assert.equal(positionSchema.parse({ position_name: "Chair", position_level: "1" }).position_level, 1);
  assert.equal(assignSchema.safeParse({ member_id: "1", position_id: "2", term_end_date: "2001-01-01" }).success, false);
  assert.equal(assignSchema.safeParse({ member_id: "1", position_id: "2" }).success, true);
});

test("shares line", () => {
  assert.deepEqual(sharesLine(10, 25), { text: "10 of 25 shares: 15 more needed", met: false });
  assert.equal(sharesLine(30, 25).met, true);
  assert.equal(sharesLine(5, null).met, null);
});

test("appoint positions come from the defined board positions, highest rank first", () => {
  assert.equal(positionCode(" Vice Chairman "), "vice_chairman");
  assert.equal(positionCode("Deputy Chair (Acting)"), "deputy_chair_acting");
  const o = positionOptions([{ id: 3, position_name: "Director", position_level: 5 }, { id: 9, position_name: "Deputy Chair", position_level: 2 }]);
  assert.deepEqual(o.map((x) => [x.value, x.label, x.id]), [["deputy_chair", "Deputy Chair", 9], ["director", "Director", 3]]);
  assert.deepEqual(positionOptions(undefined), []);
});
