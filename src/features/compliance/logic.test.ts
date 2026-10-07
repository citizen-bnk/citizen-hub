import { test } from "node:test";
import assert from "node:assert/strict";
import { canUpload, docState, fieldErrors, progress, readiness, rejectionReason, requirementSchema } from "./logic";

const item = (name: string, status: string | null, required = true) => ({
  is_required: required, is_complete: status === "approved", requirement: { name }, submission: status ? { status } : null,
});

test("docState maps backend statuses", () => {
  assert.equal(docState(item("a", null)), "missing");
  assert.equal(docState(item("a", "submitted")), "under_review");
  assert.equal(docState(item("a", "resubmission_required")), "rejected");
  assert.equal(docState(item("a", "approved")), "approved");
});

test("members cannot upload while a file is in review or approved", () => {
  assert.equal(canUpload(item("a", null)), true);
  assert.equal(canUpload(item("a", "rejected")), true);
  assert.equal(canUpload(item("a", "under_review")), false);
  assert.equal(canUpload(item("a", "approved")), false);
});

test("progress counts required documents only", () => {
  const p = progress([item("ID", "approved"), item("Tax", "rejected"), item("CV", null), item("Photo", "submitted"), item("Extra", null, false)]);
  assert.deepEqual([p.required, p.approved, p.underReview, p.needsAction, p.percent], [4, 1, 1, 2, 25]);
  assert.deepEqual(p.missing, ["Tax", "CV"]);
});

test("progress with nothing required is complete", () => assert.equal(progress([]).percent, 100));

test("readiness", () => {
  assert.equal(readiness({ total_required: 3, total_submitted: 3, total_approved: 3, total_rejected: 0 }), "complete");
  assert.equal(readiness({ total_required: 3, total_submitted: 2, total_approved: 1, total_rejected: 1 }), "needs_attention");
  assert.equal(readiness({ total_required: 3, total_submitted: 0, total_approved: 0, total_rejected: 0 }), "not_started");
  assert.equal(readiness({ total_required: 3, total_submitted: 2, total_approved: 1, total_rejected: 0 }), "in_progress");
});

test("requirement form validation", () => {
  const bad = requirementSchema.safeParse({ name: "x", jurisdictions: [], is_required: true, requires_template: false, validity_period_days: "-3", display_order: "", default_severity: "normal" });
  assert.equal(bad.success, false);
  if (!bad.success) assert.deepEqual(Object.keys(fieldErrors(bad.error)).sort(), ["jurisdictions", "name", "validity_period_days"]);
  const ok = requirementSchema.parse({ name: "Passport", jurisdictions: ["global"], is_required: true, requires_template: false, validity_period_days: "", display_order: "2", default_severity: "normal" });
  assert.equal(ok.validity_period_days, null);
  assert.equal(ok.display_order, 2);
});

test("rejection needs a reason", () => {
  assert.notEqual(rejectionReason(" "), null);
  assert.equal(rejectionReason("Scan is unreadable"), null);
});
