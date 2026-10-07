import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accessSummary, agreementRows, emptyLoi, fileSize, fileTarget, groupByCategory, matches, nextVersion, reasonSchema, signingErrors, unsigned, type MyStatus,
} from "./logic";

const none: MyStatus = { ncnda_signed: false, ncnda_signed_at: null, terms_signed: false, terms_signed_at: null, loi_agreed: false, loi_agreed_at: null, loi_file_url: null, loi_status: null };
const all: MyStatus = { ...none, ncnda_signed: true, ncnda_signed_at: "2026-09-02", terms_signed: true, terms_signed_at: "2026-09-02", loi_agreed: true, loi_agreed_at: "2026-09-02", loi_status: "pending" };

test("agreement rows list the three agreements in signing order", () => {
  assert.deepEqual(agreementRows(none).map((r) => r.key), ["ncnda", "terms", "letter_of_intent"]);
  assert.equal(unsigned(agreementRows(none)).length, 3);
  assert.equal(unsigned(agreementRows({ ...none, terms_signed: true })).length, 2);
});

test("only a signed LOI carries a review state", () => {
  assert.equal(agreementRows({ ...none, loi_status: "pending" })[2].review, null);
  assert.equal(agreementRows(all)[2].review, "pending");
});

test("access summary", () => {
  assert.match(accessSummary(agreementRows(none), false).text, /3 of 3/);
  assert.equal(accessSummary(agreementRows(all), true).tone, "good");
  assert.equal(accessSummary(agreementRows({ ...all, loi_status: "rejected" }), true).tone, "bad");
  assert.equal(accessSummary(agreementRows({ ...all, loi_status: "approved" }), true).text, "Access granted");
});

test("signing needs a name, and LOI details only when the LOI is picked", () => {
  assert.ok(signingErrors("", ["ncnda"], emptyLoi()).signature);
  assert.deepEqual(signingErrors("Thabo Mokoena", ["ncnda", "terms"], emptyLoi()), {});
  const e = signingErrors("Thabo Mokoena", ["letter_of_intent"], { ...emptyLoi(), investment_amount: "-5", contact_email: "nope" });
  assert.ok(e.investor_name && e.investment_amount && e.contact_email);
  assert.deepEqual(signingErrors("Thabo Mokoena", ["letter_of_intent"], { ...emptyLoi(), investor_name: "Thabo", investment_amount: "250000", contact_email: "t@x.co" }), {});
});

test("access reason needs a few words", () => {
  assert.equal(reasonSchema.safeParse("ok").success, false);
  assert.equal(reasonSchema.safeParse("Due diligence").success, true);
});

test("documents group by category and filter", () => {
  const d = (id: number, c: string | null, n: string) => ({ id, category_id: c ? 1 : null, category_name: c, document_name: n, description: null });
  const docs = [d(1, "Corporate", "Articles"), d(2, "Financial", "Plan"), d(3, "Corporate", "Register"), d(4, null, "Misc")];
  assert.deepEqual(groupByCategory(docs).map((g) => [g.name, g.docs.length]), [["Corporate", 2], ["Financial", 1], ["Other", 1]]);
  assert.equal(docs.filter((x) => matches(x, "reg", "")).length, 1);
  assert.equal(docs.filter((x) => matches(x, "", "Other")).length, 1);
});

test("file helpers", () => {
  assert.equal(fileSize(900), "900 B");
  assert.equal(fileSize(2_048), "2 KB");
  assert.equal(fileSize(2_845_000), "2.7 MB");
  assert.deepEqual(fileTarget("https://x.test/a.pdf", "A"), { kind: "link", url: "https://x.test/a.pdf" });
  assert.deepEqual(fileTarget("data_room_Plan01012026V1.pdf", "Business Plan: 2026"), { kind: "key", key: "data_room_Plan01012026V1.pdf", name: "Business Plan 2026.pdf" });
  assert.equal(nextVersion("1.0"), "1.1");
  assert.equal(nextVersion("v2"), "v2");
});

test("the letter of intent starts from the profile and never from blanks", async () => {
  const { loiFromProfile } = await import("./logic");
  const loi = loiFromProfile({ full_name: "Thabo Mokoena", email: "t@example.com", phone: "+266 5800 1234", business_name: null, investment_purpose: "Growth" });
  assert.deepEqual([loi.investor_name, loi.contact_email, loi.contact_phone, loi.entity_name, loi.investment_purpose], ["Thabo Mokoena", "t@example.com", "+266 5800 1234", "", "Growth"]);
  assert.equal(loiFromProfile(null).investor_name, "");
});
