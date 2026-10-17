import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { checkUnits, reviewProblem, subscriptionAmount, withdrawalAllowed, reviewInput, subscribeInput } from "../lib/subscriptions";
import { testDatabase, person } from "./support/database";
import { subscribe, withdraw, mySubscriptions, review, reviewQueue, openOpportunities } from "../lib/subscription-store";
import { ServiceIssue } from "../lib/db";

const drive = (id: string) => `https://drive.google.com/file/d/${id}/view`;
const AGREEMENT = drive("1AgreementFileIdentifier123");
const PAYMENT = drive("1PaymentEvidenceIdentifier12");

test("amounts are exact in minor units", () => {
  assert.equal(subscriptionAmount(10, "100.00"), "1000.00");
  assert.equal(subscriptionAmount(3, "0.10"), "0.30");
  assert.equal(subscriptionAmount(1000, "250"), "250000.00");
  assert.throws(() => subscriptionAmount(0, "10"));
  assert.throws(() => subscriptionAmount(1.5, "10"));
  assert.throws(() => subscriptionAmount(2, "-1"));
});

test("unit limits are enforced", () => {
  assert.equal(checkUnits(10, 10, 1000), null);
  assert.match(checkUnits(9, 10, 1000)!, /minimum/);
  assert.match(checkUnits(1001, 10, 1000)!, /maximum/);
  assert.ok(checkUnits(2.5, 1, 9));
  assert.equal(checkUnits(5_000_000, 1000, null), null);
});

test("withdrawal stops once evidence is attached", () => {
  assert.equal(withdrawalAllowed({ status: "submitted", agreement_link: null, payment_link: null }), true);
  assert.equal(withdrawalAllowed({ status: "awaiting_payment", agreement_link: AGREEMENT, payment_link: null }), false);
  assert.equal(withdrawalAllowed({ status: "received", agreement_link: null, payment_link: null }), false);
});

test("review rules: no self review, no reopening, evidence before confirmation", () => {
  const base = { status: "submitted", agreement_link: null, payment_link: null, person_id: "investor" };
  assert.match(reviewProblem(base, { status: "under_review", note: "" }, "investor")!, /own/);
  assert.equal(reviewProblem(base, { status: "under_review", note: "" }, "admin"), null);
  assert.match(reviewProblem(base, { status: "received", note: "Bank statement matched", payment_link: PAYMENT }, "admin")!, /agreement/);
  assert.match(reviewProblem(base, { status: "received", note: "Bank statement matched", agreement_link: AGREEMENT }, "admin")!, /payment evidence/);
  assert.match(reviewProblem(base, { status: "received", note: "ok", agreement_link: AGREEMENT, payment_link: PAYMENT }, "admin")!, /reconciled/);
  assert.equal(reviewProblem(base, { status: "received", note: "Bank statement matched ref 118", agreement_link: AGREEMENT, payment_link: PAYMENT }, "admin"), null);
  assert.match(reviewProblem(base, { status: "declined", note: "no" }, "admin")!, /Explain/);
  for (const closed of ["declined", "withdrawn"]) assert.match(reviewProblem({ ...base, status: closed }, { status: "under_review", note: "" }, "admin")!, /cannot move/);
  assert.match(reviewProblem({ ...base, status: "received", agreement_link: AGREEMENT, payment_link: PAYMENT }, { status: "under_review", note: "" }, "admin")!, /cannot move/);
});

test("inputs reject unknown fields, non-Drive evidence and missing consent", () => {
  const id = randomUUID();
  assert.ok(subscribeInput.safeParse({ action: "subscribe", request_key: id, opportunity_id: id, version: 1, units: 10, source_of_funds: "Salary", purpose: "Long term", consent: true }).success);
  assert.ok(!subscribeInput.safeParse({ action: "subscribe", request_key: id, opportunity_id: id, version: 1, units: 10, source_of_funds: "Salary", purpose: "Long term", consent: false }).success);
  assert.ok(!subscribeInput.safeParse({ action: "subscribe", request_key: id, opportunity_id: id, version: 1, units: 10, source_of_funds: "Salary", purpose: "Long term", consent: true, unit_price: 1 }).success);
  const base = { action: "review", id, version: 1, status: "received", note: "x" };
  assert.ok(reviewInput.safeParse({ ...base, agreement_link: AGREEMENT }).success);
  assert.ok(!reviewInput.safeParse({ ...base, agreement_link: "https://evil.example/file/d/1AgreementFileIdentifier123" }).success);
  assert.ok(!reviewInput.safeParse({ ...base, payment_link: "https://drive.google.com/drive/folders/1AgreementFileIdentifier123" }).success);
});

test("end to end against the real schema", async () => {
  const db = await testDatabase();
  const investor = await person(db, "Thabo Investor", ["investor"]);
  const other = await person(db, "Neo Other", ["investor"]);
  const admin = await person(db, "Ada Admin", ["admin"]);
  const customer = await person(db, "Cara Customer", ["customer"]);

  await db.query(`INSERT INTO hub_opportunities(reference,title,summary,instrument,unit_price,min_units,max_units,status,scope)
    VALUES('test-offer','Test offer','Fictional','SAFE',100,10,1000,'open','demonstration'),('uncapped','Uncapped offer','Fictional','SAFE',10,1000,NULL,'open','demonstration'),
          ('closed-offer','Closed offer','Fictional','SAFE',10,1,10,'closed','demonstration')`);
  const opportunities = await openOpportunities(investor);
  assert.deepEqual(opportunities.map((o) => o.reference).sort(), ["test-offer", "uncapped"], "only open offers are listed");
  const offer = opportunities.find((o) => o.reference === "test-offer")!;

  const key = randomUUID();
  const request = { request_key: key, opportunity_id: offer.id, version: offer.version, units: 20, source_of_funds: "Salary savings", purpose: "Long-term holding" };
  const first = await subscribe(investor, request);
  assert.equal(first.amount, "2000.00");
  assert.equal(first.repeated, false);
  const again = await subscribe(investor, request);
  assert.equal(again.id, first.id, "a retried submit does not create a second request");
  assert.equal(again.repeated, true);
  assert.equal((await mySubscriptions(investor)).length, 1);
  assert.equal((await mySubscriptions(other)).length, 0, "requests are private to their owner");

  await assert.rejects(() => subscribe(investor, { ...request, request_key: randomUUID(), units: 1 }), (e: unknown) => e instanceof ServiceIssue && e.code === "UNITS_OUT_OF_RANGE");
  await assert.rejects(() => subscribe(investor, { ...request, request_key: randomUUID(), version: 99 }), (e: unknown) => e instanceof ServiceIssue && e.code === "OPPORTUNITY_CHANGED");
  await assert.rejects(() => subscribe(customer, { ...request, request_key: randomUUID() }), (e: unknown) => e instanceof ServiceIssue && e.code === "INVESTOR_ROLE_REQUIRED");

  const queue = await reviewQueue(admin);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].investor_name, "Thabo Investor");

  await assert.rejects(() => review(investor, { action: "review", id: first.id, version: 1, status: "under_review", note: "" }), (e: unknown) => e instanceof ServiceIssue && e.code === "REVIEWER_ROLE_REQUIRED");
  await review(admin, { action: "review", id: first.id, version: 1, status: "under_review", note: "" });
  await assert.rejects(() => review(admin, { action: "review", id: first.id, version: 1, status: "awaiting_payment", note: "" }), (e: unknown) => e instanceof ServiceIssue && e.code === "SUBSCRIPTION_CHANGED", "stale version is refused");
  await assert.rejects(() => review(admin, { action: "review", id: first.id, version: 2, status: "received", note: "Matched statement line 4", agreement_link: AGREEMENT }), (e: unknown) => e instanceof ServiceIssue && e.code === "REVIEW_NOT_ALLOWED");
  await review(admin, { action: "review", id: first.id, version: 2, status: "received", note: "Matched statement line 4", agreement_link: AGREEMENT, payment_link: PAYMENT });
  const [paid] = await mySubscriptions(investor);
  assert.equal(paid.status, "received");
  assert.equal(paid.version, 3);
  await assert.rejects(() => withdraw(investor, first.id, 3), (e: unknown) => e instanceof ServiceIssue && e.code === "WITHDRAWAL_NOT_ALLOWED");
  await assert.rejects(() => review(admin, { action: "review", id: first.id, version: 3, status: "declined", note: "Changed our minds" }), (e: unknown) => e instanceof ServiceIssue && e.code === "REVIEW_NOT_ALLOWED", "confirmed receipt cannot be reversed");

  const uncapped = opportunities.find((o) => o.reference === "uncapped")!;
  const big = await subscribe(investor, { request_key: randomUUID(), opportunity_id: uncapped.id, version: uncapped.version, units: 5_000_000, source_of_funds: "Business", purpose: "Growth" });
  assert.equal(big.amount, "50000000.00", "an offer without a maximum accepts any quantity above the minimum");
  const closed = (await db.query<{ id: string; version: number }>("SELECT id,version FROM hub_opportunities WHERE reference='closed-offer'")).rows[0];
  await assert.rejects(() => subscribe(investor, { request_key: randomUUID(), opportunity_id: closed.id, version: closed.version, units: 5, source_of_funds: "Salary", purpose: "Test" }), (e: unknown) => e instanceof ServiceIssue && e.code === "OPPORTUNITY_UNAVAILABLE");

  const audit = await db.query<{ action: string }>("SELECT action FROM hub_audit WHERE resource_type='subscription' ORDER BY id");
  assert.deepEqual(audit.rows.map((r) => r.action), ["subscription.submitted", "subscription.under_review", "subscription.received", "subscription.submitted"]);

  const second = await subscribe(investor, { ...request, request_key: randomUUID(), units: 10 });
  await withdraw(investor, second.id, 1);
  assert.equal((await mySubscriptions(investor)).find((s) => s.id === second.id)!.status, "withdrawn");
  await assert.rejects(() => withdraw(other, second.id, 2), (e: unknown) => e instanceof ServiceIssue && e.code === "SUBSCRIPTION_UNAVAILABLE", "another investor cannot withdraw it");
});
