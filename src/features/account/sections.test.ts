import assert from "node:assert/strict";
import test from "node:test";
import { optionsFor, editable, initials, maskId, missingSections, rowsOf, sectionById, sectionPayload, shown, visibleSections } from "./sections";
import { emptyForm } from "./logic";

const profile = { full_name: "Thabo Mokoena", email: "t@example.com", phone: "+266 5800 1234", id_number: "LS1234567", account_type: "personal", date_of_birth: "1988-04-02", gender: "male", city: "Maseru", country: "Lesotho" };

test("the ID number is masked in the read-only view", () => {
  assert.equal(maskId("LS1234567"), "••••••567");
  assert.equal(maskId("ab"), "••");
  assert.equal(shown(sectionById("identity").fields.find((f) => f.name === "id_number")!, profile), "••••••567");
});

test("only what has a value is shown, with choices spelled out and dates formatted", () => {
  const rows = rowsOf(sectionById("identity"), profile).map((r) => [r.f.name, r.value]);
  assert.deepEqual(rows, [["full_name", "Thabo Mokoena"], ["account_type", "Personal"], ["date_of_birth", "2 Apr 1988"], ["gender", "Male"], ["id_number", "••••••567"]]);
  assert.deepEqual(rowsOf(sectionById("work"), profile), []);
});

test("Investing shows for investors or when filled in; Business only for business accounts", () => {
  const ids = (p: object, roles: string[]) => visibleSections(p, roles).map((s) => s.id);
  assert.deepEqual(ids(profile, ["board_member"]), ["identity", "contact", "address", "work"]);
  assert.deepEqual(ids(profile, ["investor"]), ["identity", "contact", "address", "work", "investor"]);
  assert.deepEqual(ids({ ...profile, source_of_funds: "Salary" }, []), ["identity", "contact", "address", "work", "investor"]);
  assert.ok(ids({ ...profile, account_type: "business" }, []).includes("business"));
});

test("a section's update has only its editable fields, can clear text, and never sends an emptied date", () => {
  const v = { ...emptyForm(), full_name: "Thabo M", nationality: "", date_of_birth: "", gender: "male", account_type: "personal", email: "t@example.com", id_number: "LS1234567" };
  const body = sectionPayload(sectionById("identity"), v, 4);
  assert.deepEqual(body, { version: 4, full_name: "Thabo M", account_type: "personal", gender: "male", nationality: "" });
  assert.ok(!("id_number" in body) && !("email" in sectionPayload(sectionById("contact"), v, 4)));
  assert.deepEqual(editable(sectionById("contact")).map((f) => f.name), ["phone"]);
});

test("initials and the sections still to fill in", () => {
  assert.equal(initials("Thabo Mokoena"), "TM");
  assert.equal(initials("  naledi "), "N");
  assert.equal(initials(""), "?");
  assert.deepEqual(missingSections(profile, []).map((s) => s.id), ["work"]);
});

test("choices come from the policy lists, with the empty choice where an answer is optional", () => {
  const gender = sectionById("identity").fields.find((f) => f.name === "gender")!;
  assert.deepEqual(optionsFor(gender).map((o) => o[0]), ["", "male", "female", "other"]);
  const lists = { gender: [{ code: "nb", label: "Non-binary", display_order: 1 }] };
  assert.deepEqual(optionsFor(gender, lists), [["", "Prefer not to say"], ["nb", "Non-binary"]]);
  assert.equal(shown(gender, { gender: "nb" }, lists), "Non-binary");
  assert.equal(shown(gender, { gender: "male" }, lists), "Male");
  assert.deepEqual(optionsFor(sectionById("identity").fields.find((f) => f.name === "account_type")!).map((o) => o[0]), ["personal", "business"]);
});
