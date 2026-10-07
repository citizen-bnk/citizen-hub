import test from "node:test";
import assert from "node:assert/strict";
import { buildTodo, checkQuietHours, emptyForm, fromProfile, linkFor, needsSetup, plain, prefsPayload, prefsToForm, toPayload, validateProfile } from "./logic";

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

test("do-not-disturb hours", () => {
  const f = prefsToForm({ channel_email: true, channel_sms: false, channel_push: true, quiet_hours_start: "22:00:00", quiet_hours_end: "07:00:00", timezone: "Africa/Maseru" });
  assert.equal(f.dnd, true);
  assert.equal(f.start, "22:00");
  assert.equal(checkQuietHours(f), null);
  assert.match(checkQuietHours({ ...f, end: "22:00" })!, /different/);
  assert.match(checkQuietHours({ ...f, start: "" })!, /both/);
  assert.equal(checkQuietHours({ ...f, dnd: false, start: "" }), null);
  assert.deepEqual(prefsPayload({ ...f, dnd: false }).quiet_hours_start, null);
  assert.equal(prefsPayload(f).quiet_hours_end, "07:00:00");
});

test("links from old addresses go to the new ones", () => {
  assert.equal(linkFor({ email_type: "x", metadata: { url: "/complete-profile" } }), "/account/setup");
  assert.equal(linkFor({ email_type: "x", metadata: { url: "/my-subscriptions/" } }), "/portfolio");
  assert.equal(linkFor({ email_type: "x", metadata: { url: "/data-room" } }), "/data-room");
  assert.equal(linkFor({ email_type: "profile_completion", metadata: null }), "/account/setup");
  assert.equal(linkFor({ email_type: "x", metadata: { url: "https://evil.example" } }), undefined);
});

test("to-do list from one feed", () => {
  assert.equal(plain("<p>Hello   <b>there</b></p>"), "Hello there");
  const n = (id: number, o = {}) => ({ id, email_subject: `S${id}`, email_content: "<p>Body</p>", email_type: "general", read_status: false, metadata: null, ...o });
  const items = buildTodo({
    profileMissing: true,
    invitations: [{ token: "t1", role: "board_member", invited_by_name: "Naledi" }],
    notifications: [n(1, { email_type: "profile_completion" }), n(2, { read_status: true }), n(3, { metadata: { url: "/board-documents" } })],
  });
  assert.deepEqual(items.map((i) => i.id), ["profile", "inv-t1", "n-3"]);
  assert.equal(items[1].title, "Accept your invitation as board member");
  assert.equal(items[2].href, "/compliance");
  assert.deepEqual(buildTodo({ profileMissing: false, invitations: [], notifications: [] }), []);
});
