import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedActions, filterSubs, fromBoard, fromCore, orderTotal, outstanding, stats, validateNew, validatePayment, type Sub } from "./logic.ts";

const base: Sub = {
  id: "SUB-1", name: "Thabo Mokoena", email: "t@x.ls", shares: 100, shareClass: "Class B", total: 1000, paid: 0, method: "one-time",
  status: "active", paymentStatus: "pending", createdAt: null, hasProof: false, boardId: null,
};
const sub = (p: Partial<Sub>): Sub => ({ ...base, ...p });

test("a fresh subscription can take a payment and a proof, nothing else", () => {
  assert.deepEqual(allowedActions(base), ["record_payment", "upload_proof"]);
});

test("a proof waiting for review can be verified or rejected", () => {
  const a = allowedActions(sub({ hasProof: true, paymentStatus: "proof_submitted" }));
  assert.ok(a.includes("verify") && a.includes("reject"));
});

test("a proof that was already decided cannot be verified again", () => {
  assert.ok(!allowedActions(sub({ hasProof: true, paymentStatus: "verified" })).includes("verify"));
});

test("a completed subscription offers certificate, letter and receipt but no payment", () => {
  const a = allowedActions(sub({ status: "completed", paid: 1000, paymentStatus: "paid" }));
  assert.deepEqual(a, ["issue_certificate", "welcome_letter", "receipt"]);
});

test("a cancelled subscription offers nothing but its receipt if money came in", () => {
  assert.deepEqual(allowedActions(sub({ status: "cancelled" })), []);
  assert.deepEqual(allowedActions(sub({ status: "cancelled", paid: 10 })), ["receipt"]);
});

test("board actions need a board subscription and a super admin", () => {
  const b = sub({ boardId: 7 });
  assert.ok(!allowedActions(b).includes("cancel"));
  assert.ok(allowedActions(b, { superAdmin: true }).includes("transfer_member"));
  assert.ok(!allowedActions(sub({ boardId: 7, status: "cancelled" }), { superAdmin: true }).includes("cancel"));
  assert.ok(!allowedActions(base, { superAdmin: true }).includes("cancel"));
});

test("outstanding never goes below zero", () => {
  assert.equal(outstanding(sub({ total: 100, paid: 150 })), 0);
});

test("stats count what needs attention and sum money without cancelled ones", () => {
  const s = stats([
    sub({ id: "a", hasProof: true, paymentStatus: "proof_submitted", total: 500 }),
    sub({ id: "b", total: 300, paid: 100, status: "partial", paymentStatus: "partial" }),
    sub({ id: "c", total: 900, paid: 900, status: "completed", paymentStatus: "paid" }),
    sub({ id: "d", total: 5000, status: "cancelled" }),
  ]);
  assert.equal(s.awaitingVerification, 1);
  assert.equal(s.pendingPayment, 0);
  assert.equal(s.completed, 1);
  assert.equal(s.total, 1700);
  assert.equal(s.paid, 1000);
  assert.equal(s.outstanding, 700);
});

test("filters by status and by name, email or id", () => {
  const rows = [base, sub({ id: "SUB-2", name: "Lerato", email: "l@y.ls", status: "completed", paymentStatus: "paid", paid: 1000 })];
  assert.equal(filterSubs(rows, { search: "lera", status: "all" }).length, 1);
  assert.equal(filterSubs(rows, { search: "sub-1", status: "all" }).length, 1);
  assert.equal(filterSubs(rows, { search: "", status: "completed" }).length, 1);
  assert.equal(filterSubs(rows, { search: "", status: "pending_payment" })[0].id, "SUB-1");
});

test("backend rows are normalised, including the board's numeric id", () => {
  const c = fromCore({ subscription_id: "S", full_name: "A", email: "a@b", num_shares: 3, total_amount: "30.5", amount_paid: 0, status: "active", payment_status: null, payment_proof_path: "p/x.pdf" });
  assert.equal(c.total, 30.5);
  assert.equal(c.paymentStatus, "active");
  assert.equal(c.hasProof, true);
  assert.equal(fromBoard({ id: 12, subscription_id: "S", share_class: "Class A" }).boardId, 12);
});

const cls = { name: "Class B", price_per_share: 10, min_shares: 5, max_shares: 500, available_shares: 100, currency: "LSL" };
const good = { full_name: "Thabo M", email: "t@x.ls", id_number: "A1", phone: "+26650000000", share_class: "Class B", num_shares: 10, payment_method: "bank_transfer" as const };

test("the order total is price times whole shares", () => {
  assert.equal(orderTotal(10, cls), 100);
  assert.equal(orderTotal(10.9, cls), 100);
  assert.equal(orderTotal(10, undefined), 0);
});

test("a complete form is valid and shows no messages", () => {
  assert.deepEqual(validateNew(good, cls), {});
});

test("the form explains each missing or wrong field", () => {
  const e = validateNew({ ...good, email: "nope", full_name: "", num_shares: 2 }, cls);
  assert.ok(e.email && e.full_name);
  assert.match(e.num_shares, /minimum/);
  assert.match(validateNew({ ...good, num_shares: 101 }, cls).num_shares, /left/);
  assert.match(validateNew({ ...good, num_shares: 501 }, { ...cls, available_shares: 900 }).num_shares, /maximum/);
});

test("a payment must be positive, referenced and not above what is owed", () => {
  assert.deepEqual(validatePayment({ amount: 50, payment_reference: "REF1" }, 100), {});
  assert.ok(validatePayment({ amount: 0, payment_reference: "REF1" }, 100).amount);
  assert.ok(validatePayment({ amount: 50, payment_reference: " " }, 100).payment_reference);
  assert.ok(validatePayment({ amount: 150, payment_reference: "R" }, 100).amount);
});
