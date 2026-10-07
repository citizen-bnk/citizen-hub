import test from "node:test";
import assert from "node:assert/strict";
import { canApprove, canCancel, canRetry, canSend, countByStatus, dateInput, failedCount, idsFor, initialValues, toBody, validate, type FieldDef } from "./logic";

const rows = [
  { id: 1, status: "draft" }, { id: 2, status: "approved" }, { id: 3, status: "sent" }, { id: 4, status: "cancelled" }, { id: 5, status: "draft" },
];

test("draft status rules", () => {
  assert.ok(canApprove("draft") && !canApprove("approved") && !canApprove("sent"));
  assert.ok(canSend("approved") && !canSend("draft") && !canSend("sent"));
  assert.ok(canCancel("draft") && canCancel("approved") && !canCancel("sent") && !canCancel("cancelled"));
});

test("idsFor keeps only selected rows the action applies to", () => {
  const sel = new Set([1, 2, 3, 4]);
  assert.deepEqual(idsFor("approve", rows, sel), [1]);
  assert.deepEqual(idsFor("send", rows, sel), [2]);
  assert.deepEqual(idsFor("cancel", rows, sel), [1, 2]);
  assert.deepEqual(idsFor("approve", rows, new Set()), []);
});

test("countByStatus and retry", () => {
  assert.deepEqual(countByStatus(rows), { draft: 2, approved: 1, sent: 1, cancelled: 1 });
  assert.ok(canRetry("failed") && !canRetry("sent") && !canRetry("pending"));
  assert.equal(failedCount({ failed: 3 }), 3);
  assert.equal(failedCount(undefined), 0);
  assert.equal(failedCount({ failed: null }), 0);
});

const fields: FieldDef[] = [
  { name: "title", label: "Title", required: true, max: 10 },
  { name: "when", label: "Date", type: "date", required: true },
  { name: "order", label: "Order", type: "number" },
  { name: "link", label: "Link", type: "url" },
  { name: "kind", label: "Kind", type: "select", options: ["a", "b"] },
  { name: "note", label: "Note" },
];

test("validate reports missing, long and malformed values", () => {
  assert.deepEqual(validate(fields, { title: "ok", when: "2026-01-02", order: "3", link: "https://x.co", kind: "a" }), {});
  const e = validate(fields, { title: "  ", when: "nope", order: "1.5", link: "x y", kind: "z" });
  assert.deepEqual(Object.keys(e).sort(), ["kind", "link", "order", "title", "when"]);
  assert.match(validate(fields, { title: "far too long title", when: "2026-01-02" }).title, /at most 10/);
});

test("toBody converts numbers and blanks", () => {
  assert.deepEqual(toBody(fields, { title: " Hi ", when: "2026-01-02", order: "", link: "", kind: "", note: "" }), {
    title: "Hi", when: "2026-01-02", order: 0, link: null, kind: null, note: null,
  });
  assert.equal(toBody(fields, { title: "x", when: "d", order: "7" }).order, 7);
});

test("initialValues from an item and for a new form", () => {
  assert.equal(dateInput("2026-03-04T10:00:00Z"), "2026-03-04");
  assert.deepEqual(initialValues(fields, { title: "T", when: "2026-03-04T00:00:00", order: 2, link: null, kind: "b" }), {
    title: "T", when: "2026-03-04", order: "2", link: "", kind: "b", note: "",
  });
  assert.equal(initialValues(fields).kind, "a");
  assert.equal(initialValues(fields).title, "");
});
