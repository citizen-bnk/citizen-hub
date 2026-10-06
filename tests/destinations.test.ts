import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, apiGet } from "../src/api.js";
import { destinationsFor, workspaceUrl } from "../src/destinations.js";

const labels = (roles: string[]) => destinationsFor(roles).map((d) => d.label);

test("each role opens its own workspaces and nothing else", () => {
  assert.deepEqual(labels(["investor"]), ["My investments"]);
  assert.deepEqual(labels(["shareholder"]), ["My investments"]);
  assert.deepEqual(labels(["board_member"]), ["Board portal"]);
  assert.deepEqual(labels(["staff"]), ["Back office"]);
  assert.deepEqual(labels(["admin"]), ["Administration"]);
  assert.deepEqual(labels(["super_admin"]), ["Administration", "Back office"]);
  assert.deepEqual(labels(["board_member", "investor"]), ["Board portal", "My investments"]);
});

test("a customer, an unknown role or no role gets no Hub workspace", () => {
  for (const roles of [["customer"], ["root"], [], ["ADMIN"]]) assert.deepEqual(labels(roles), []);
});

test("workspace links join a plain path to the website address and nothing else", () => {
  assert.equal(workspaceUrl("https://citizenbank.co.ls/", "/board-portal"), "https://citizenbank.co.ls/board-portal");
  assert.equal(workspaceUrl("https://citizenbank.co.ls", "//evil.test"), "https://citizenbank.co.ls/");
  assert.equal(workspaceUrl("https://citizenbank.co.ls", "https://evil.test"), "https://citizenbank.co.ls/");
});

test("the API client sends the bearer token and turns failures into readable errors", async () => {
  let seen: { url: string; auth: string | null } | undefined;
  const ok = (async (url: string, init: RequestInit) => {
    seen = { url, auth: new Headers(init.headers).get("authorization") };
    return new Response(JSON.stringify({ person_id: "p" }), { status: 200 });
  }) as unknown as typeof fetch;
  assert.deepEqual(await apiGet("/me", "Bearer t", ok), { person_id: "p" });
  assert.deepEqual(seen, { url: "/api/platform/me", auth: "Bearer t" });
  const denied = (async () => new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(apiGet("/me", "Bearer x", denied), (e) => e instanceof ApiError && e.status === 401 && e.message === "Not authenticated");
  const html = (async () => new Response("<html>", { status: 502 })) as unknown as typeof fetch;
  await assert.rejects(apiGet("/me", "", html), (e) => e instanceof ApiError && e.message === "Request failed (502)");
});
