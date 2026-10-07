import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedActions, classesOf, filterCerts, fromRow, totals, validateReason, validateSign, validateTemplate, type Cert } from "./logic.ts";

const c = (o: Partial<Cert>): Cert => ({ id: 1, number: "CB-2026-0001", holder: "Thabo Mokoena", shares: 100, shareClass: "Class B", issued: null, status: "active", ...o });

test("an active certificate can be signed, sent, regenerated or revoked but not reactivated", () => {
  assert.deepEqual(allowedActions(c({})), ["sign", "download", "resend", "regenerate", "revoke"]);
});

test("a revoked certificate can only be reactivated", () => {
  assert.deepEqual(allowedActions(c({ status: "revoked" })), ["reactivate"]);
  assert.deepEqual(allowedActions(c({ status: "pending" })), []);
});

test("rows are read whichever name the backend gives the holder", () => {
  assert.equal(fromRow({ id: 3, certificate_number: "X", full_name: "A", shares_count: 5, share_class: "Class A", status: "active" }).holder, "A");
  assert.equal(fromRow({ id: "4", certificate_number: "Y", shareholder_name: "B" }).holder, "B");
  assert.equal(fromRow({ id: "4" }).id, 4);
});

test("filters by status, class and a search over holder and number", () => {
  const rows = [c({}), c({ id: 2, number: "CB-2026-0002", holder: "Lerato", status: "revoked", shareClass: "Class A" })];
  assert.equal(filterCerts(rows, { search: "lera", status: "all", shareClass: "all" }).length, 1);
  assert.equal(filterCerts(rows, { search: "0001", status: "all", shareClass: "all" })[0].id, 1);
  assert.equal(filterCerts(rows, { search: "", status: "revoked", shareClass: "all" })[0].id, 2);
  assert.equal(filterCerts(rows, { search: "", status: "all", shareClass: "Class A" }).length, 1);
  assert.deepEqual(classesOf(rows), ["Class A", "Class B"]);
});

test("totals count active shares only", () => {
  assert.deepEqual(totals([c({}), c({ id: 2, shares: 50, status: "revoked" })]), { count: 2, active: 1, revoked: 1, activeShares: 100 });
});

test("signing needs a name, a role and a drawn signature", () => {
  assert.deepEqual(validateSign({ signer_name: "Naledi T", signer_role: "director", signature_image: "data:image/png;base64,AAA" }), {});
  const e = validateSign({ signer_name: "", signature_image: "" });
  assert.ok(e.signer_name && e.signer_role && e.signature_image);
});

test("a revoke reason must say something", () => {
  assert.ok(validateReason("  ab "));
  assert.equal(validateReason("Issued in error"), undefined);
});

test("a template needs a name and a PDF", () => {
  const pdf = { name: "cert.PDF" } as File;
  assert.deepEqual(validateTemplate("Standard", pdf), {});
  assert.ok(validateTemplate("", pdf).template_name);
  assert.ok(validateTemplate("Standard", null).file);
  assert.match(validateTemplate("Standard", { name: "a.docx" } as File).file, /PDF/);
});
