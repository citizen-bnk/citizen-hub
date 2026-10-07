import test from "node:test";
import assert from "node:assert/strict";
import { emptyForm, fromProfile, needsSetup, toPayload, validateProfile } from "./logic";

const ok = () => ({ ...emptyForm(), full_name: "Thabo Mokoena", phone: "+266 5800 1234", email: "t@x.co", id_number: "LS123456", date_of_birth: "1988-04-02", street_address: "12 Kingsway", city: "Maseru" });

test("a complete form has no errors, in both modes", () => {
  assert.deepEqual(validateProfile(ok(), { register: true, requireAddress: true }), {});
  assert.deepEqual(validateProfile(ok()), {});
});

test("field messages", () => {
  const e = validateProfile({ ...ok(), full_name: "T", phone: "abc", date_of_birth: "2999-01-01", linkedin_profile: "linkedin.com/x", email: "bad", id_number: "1" }, { register: true });
  assert.deepEqual(Object.keys(e).sort(), ["date_of_birth", "email", "full_name", "id_number", "linkedin_profile", "phone"]);
});

test("setup asks for the address and date of birth", () => {
  const e = validateProfile({ ...ok(), street_address: "", city: "", date_of_birth: "" }, { requireAddress: true });
  assert.deepEqual(Object.keys(e).sort(), ["city", "date_of_birth", "street_address"]);
});

test("business accounts need a business name and registration number", () => {
  const e = validateProfile({ ...ok(), account_type: "business" });
  assert.deepEqual(Object.keys(e).sort(), ["business_name", "company_registration_number"]);
});

test("payload leaves out empty answers and business fields on a personal account", () => {
  const v = { ...ok(), tax_id: "T1", employer: "" };
  const p = toPayload(v, { version: 3 });
  assert.equal(p.version, 3);
  assert.ok(!("employer" in p) && !("tax_id" in p) && !("email" in p) && !("id_number" in p));
  const r = toPayload({ ...v, account_type: "business", business_name: "B" }, { register: true });
  assert.equal(r.tax_id, "T1");
  assert.equal(r.email, "t@x.co");
  assert.ok(!("version" in r));
});

test("fromProfile turns nulls into empty text and keeps the sign-in email", () => {
  const f = fromProfile({ full_name: "A B", city: null }, "me@x.co");
  assert.equal(f.city, "");
  assert.equal(f.email, "me@x.co");
  assert.ok(needsSetup({ full_name: "A" }));
  assert.ok(needsSetup(null));
  assert.ok(!needsSetup({ full_name: "A", phone: "1", date_of_birth: "x", street_address: "s", city: "c", country: "c" }));
});
