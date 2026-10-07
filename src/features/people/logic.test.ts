import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canCancel, canResend, effectiveStatus, grantable, inTab, inviteBody, inviteSchema, parseCsv, permittedRoles, pipeline, toCsv, validateLeadCsv, withRole,
  canInviteLead, canReactivate, canSuspend, inviteLeadSchema,
} from "./logic";

test("permittedRoles keeps only roles the check allowed", () => {
  assert.deepEqual(permittedRoles({ board_member: false, investor: true }), ["investor"]);
  assert.deepEqual(permittedRoles({}), []);
});

test("invite needs a position for board members only", () => {
  const base = { full_name: "Thabo M", email: "t@x.co", role: "board_member" as const };
  assert.equal(inviteSchema.safeParse(base).success, false);
  assert.equal(inviteSchema.safeParse({ ...base, position: "director" }).success, true);
  assert.equal(inviteSchema.safeParse({ ...base, role: "investor" }).success, true);
  assert.equal(inviteSchema.safeParse({ ...base, email: "nope", position: "director" }).success, false);
});

test("inviteBody drops what does not apply", () => {
  const b = inviteBody({ full_name: " Ann ", email: "a@b.co", role: "investor", position: "director", message: " ", expires_at: "" });
  assert.deepEqual(b, { full_name: "Ann", email: "a@b.co", role: "investor", position: undefined, message: undefined, expires_at: undefined });
});

test("status rules", () => {
  const now = new Date("2026-10-07");
  assert.equal(effectiveStatus({ status: "pending", expires_at: "2026-10-01" }, now), "expired");
  assert.equal(effectiveStatus({ status: "pending", expires_at: "2026-10-20" }, now), "pending");
  assert.equal(effectiveStatus({ status: "accepted", expires_at: "2026-10-01" }, now), "accepted");
  assert.ok(canResend("pending") && canResend("sent") && !canResend("accepted"));
  assert.ok(canCancel("pending", true) && !canCancel("pending", false) && !canCancel("expired", true));
  assert.ok(inTab("cancelled", "expired") && inTab("sent", "pending") && !inTab("accepted", "pending") && inTab("x", "all"));
});

test("parseCsv handles quotes, commas, CRLF and BOM", () => {
  const rows = parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n\r\n1,2\n');
  assert.deepEqual(rows, [["a", "b"], ["x, y", 'say "hi"'], ["1", "2"]]);
});

test("validateLeadCsv", () => {
  const ok = validateLeadCsv("Full Name,Email,Country,Notes\nAnn Lee,ann@x.co,Lesotho,hi\nBob,bob@x.co,,\nCy,not-an-email,SA,\nAnn Two,ANN@x.co,SA,\n");
  assert.equal(ok.valid.length, 1);
  assert.equal(ok.valid[0].full_name, "Ann Lee");
  assert.deepEqual(ok.errors.map((e) => e.row), [3, 4, 5]);
  assert.match(ok.errors[0].message, /country/);
  assert.match(ok.errors[2].message, /twice/);
  assert.deepEqual(validateLeadCsv("name,email\nA,b").missingColumns, ["full_name", "country"]);
});

test("toCsv round-trips through the validator", () => {
  const first = validateLeadCsv('full_name,email,country,notes\n"Lee, Ann",ann@x.co,Lesotho,"a ""b"""\n');
  const again = validateLeadCsv(toCsv(first.valid));
  assert.deepEqual(again.valid, first.valid);
});

test("lead rules and pipeline", () => {
  assert.ok(canInviteLead("new") && !canInviteLead("converted"));
  assert.equal(inviteLeadSchema.safeParse({ share_class: "A", minimum_investment: "0" }).success, false);
  assert.equal(inviteLeadSchema.safeParse({ share_class: "A", minimum_investment: "5000" }).success, true);
  const p = pipeline({ total_leads: 10, leads_by_status: { new: 3, contacted: 2, interested: 1, converted: 2 }, conversion_rate: 20, total_invited: 4, invitation_response_rate: 50 });
  assert.deepEqual([p.open, p.converted, p.invited], [6, 2, 4]);
});

test("user rules", () => {
  assert.ok(canSuspend("active") && !canSuspend("suspended") && canReactivate("suspended") && !canReactivate("active"));
  assert.deepEqual(grantable(["a", "b", "c"], ["b"]), ["a", "c"]);
  const us = [{ roles: ["a"] }, { roles: ["b"] }];
  assert.equal(withRole(us, "b").length, 1);
  assert.equal(withRole(us, "all").length, 2);
});
