import test from "node:test";
import assert from "node:assert/strict";
import { defaultPlan, isInstalment, boardPlan, canRequestCertificate, checkQuantity, daysLeft, detailsSchema, documentsFor, fieldErrors, investorOffer, isOutstanding, monthlyAmount, offeredClasses, orderTotal, paidPercent, remaining, summarise, type ShareClass } from "./logic";

const sub = (o: Partial<Parameters<typeof summarise>[0][number]> = {}) => ({ status: "pending", total_amount: "1000.00", amount_paid: "250", num_shares: 100, certificate_number: null, ...o });

test("remaining and outstanding handle strings and overpayment", () => {
  assert.equal(remaining(sub()), 750);
  assert.equal(remaining(sub({ amount_paid: 2000 })), 0);
  assert.ok(isOutstanding(sub()));
  assert.ok(!isOutstanding(sub({ amount_paid: 1000 })));
  assert.ok(!isOutstanding(sub({ status: "cancelled" })));
  assert.equal(paidPercent(sub()), 25);
});

test("summarise skips cancelled subscriptions and counts what is owed", () => {
  const s = summarise([sub(), sub({ amount_paid: 1000, status: "completed", certificate_number: "C1" }), sub({ status: "cancelled" })]);
  assert.deepEqual(s, { count: 2, shares: 200, invested: 2000, paid: 1250, owed: 750, pending: 1, certificates: 1 });
});

test("daysLeft", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  assert.equal(daysLeft("2026-10-10T12:00:00Z", now), 3);
  assert.equal(daysLeft("2026-10-05T12:00:00Z", now), -2);
  assert.equal(daysLeft(null, now), null);
  assert.equal(daysLeft("nonsense", now), null);
});

test("documents follow the backend's rules", () => {
  assert.deepEqual(documentsFor(sub(), []), { certificate: false, receipt: false, welcome: false });
  assert.deepEqual(documentsFor(sub({ status: "completed", certificate_number: "C1" }), [{ status: "verified" }]), { certificate: true, receipt: true, welcome: true });
  assert.ok(!documentsFor(sub(), [{ status: "pending" }]).receipt);
});

test("a certificate can be requested only when paid, without one, and with no open request", () => {
  const paid = sub({ amount_paid: 1000, status: "completed" });
  assert.ok(canRequestCertificate(paid, 0));
  assert.ok(!canRequestCertificate(paid, 1));
  assert.ok(!canRequestCertificate({ ...paid, certificate_number: "C1" }, 0));
  assert.ok(!canRequestCertificate(sub(), 0));
});

const classes: ShareClass[] = [
  { name: "Class C", description: "", min_shares: 1, max_shares: 2, price_per_share: 1, restricted: true },
  { name: "Class B", description: "", min_shares: 1, max_shares: 2, price_per_share: 1, restricted: false },
];
test("Class C is offered to board members only", () => {
  assert.deepEqual(offeredClasses(classes, false).map((c) => c.name), ["Class B"]);
  assert.deepEqual(offeredClasses(classes, true).map((c) => c.name), ["Class C", "Class B"]);
});

test("quantity limits", () => {
  const l = { min: 1000, max: 5000, available: 3000 };
  assert.match(checkQuantity(0, l)!, /whole number/);
  assert.match(checkQuantity(1.5, l)!, /whole number/);
  assert.match(checkQuantity(999, l)!, /minimum/);
  assert.match(checkQuantity(6000, l)!, /maximum/);
  assert.match(checkQuantity(4000, l)!, /left/);
  assert.equal(checkQuantity(2000, l), null);
});

test("totals, instalments and the investor offer", () => {
  assert.equal(orderTotal(1500, 2.5), 3750);
  assert.equal(orderTotal(NaN, 2), 0);
  assert.equal(monthlyAmount(1200, "6-months"), 200);
  assert.equal(monthlyAmount(1200, "one-time"), 1200);
  assert.deepEqual(boardPlan("one-time"), { payment_method: "one_time" });
  // plans come from the policy: a code the defaults do not know, with its own months
  const plans = [{ code: "full", label: "Full", months: 1 }, { code: "q4", label: "Four", months: 4 }];
  assert.equal(monthlyAmount(1200, "q4", plans), 300);
  assert.deepEqual(boardPlan("q4", plans), { payment_method: "installment", installment_months: 4 });
  assert.equal(isInstalment("full", plans), false);
  assert.equal(isInstalment("gone", plans), false);
  assert.equal(defaultPlan(plans), "full");
  assert.equal(defaultPlan([]), "one-time");
  assert.deepEqual(boardPlan("3-months"), { payment_method: "installment", installment_months: 3 });
  const o = investorOffer({ remaining: 800, price_per_share: "10", min_subscription: 100, max_subscription: 1000 });
  assert.equal(o.classes[0].max_shares, 800);
  assert.equal(o.classes[0].price_per_share, 10);
});

test("details validation names the fields", () => {
  const e = fieldErrors(detailsSchema, { full_name: "A", email: "x", phone: "12", id_number: "" });
  assert.deepEqual(Object.keys(e).sort(), ["email", "full_name", "id_number", "phone"]);
  assert.deepEqual(fieldErrors(detailsSchema, { full_name: "Thabo Mokoena", email: "t@x.co", phone: "+266 5800 1234", id_number: "LS123456" }), {});
});
