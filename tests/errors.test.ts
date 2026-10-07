import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, asApiError, fromResponse, networkError } from "../src/platform/api/errors";

test("backend statuses become one error kind each", () => {
  const kinds = Object.fromEntries([401, 403, 404, 409, 422, 500, 503, 418].map((s) => [s, fromResponse(s, null).kind]));
  assert.deepEqual(kinds, { 401: "unauthenticated", 403: "forbidden", 404: "not_found", 409: "conflict", 422: "invalid", 500: "server", 503: "server", 418: "unknown" });
});

test("a message written for people is kept; a server error's detail is not shown", () => {
  assert.equal(fromResponse(403, { detail: "Only the chair can approve" }).message, "Only the chair can approve");
  assert.doesNotMatch(fromResponse(500, { detail: "asyncpg.exceptions.UndefinedColumn: column x" }).message, /asyncpg/);
});

test("FastAPI validation lists become field messages", () => {
  const e = fromResponse(422, { detail: [{ loc: ["body", "email"], msg: "value is not a valid email address" }, { loc: ["body", "shares"], msg: "must be > 0" }] });
  assert.deepEqual(e.fields, { email: "value is not a valid email address", shares: "must be > 0" });
  assert.equal(e.message, "value is not a valid email address");
});

test("anything thrown is turned into an ApiError", () => {
  assert.ok(asApiError(new Error("boom")) instanceof ApiError);
  assert.equal(asApiError(networkError()).kind, "network");
});
