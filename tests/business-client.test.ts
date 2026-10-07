import assert from "node:assert/strict";
import { test } from "node:test";
import { BusinessClient } from "../src/apiclient/BusinessClient.js";

test("engagement reads preserve backend arrays and send the authenticated identity", async () => {
  const features = [{ id: "feature-1", name: "Board decisions" }];
  let requested: URL | undefined;
  const client = new BusinessClient({
    baseUrl: "https://hub.example/api",
    securityWorker: async () => ({ headers: { Authorization: "Bearer verified-user" } }),
    customFetch: async (input, options) => {
      requested = new URL(String(input));
      assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer verified-user");
      return Response.json(features);
    },
  });
  const response = await client.list_feature_highlights({ active_only: false, category: "governance" });
  assert.equal(requested?.pathname, "/api/features");
  assert.equal(requested?.searchParams.get("active_only"), "false");
  assert.equal(requested?.searchParams.get("category"), "governance");
  assert.deepEqual(await response.json(), features);
});

test("forbidden business reads reject rather than becoming empty successful lists", async () => {
  const client = new BusinessClient({
    baseUrl: "https://hub.example/api",
    customFetch: async () => Response.json({ detail: "Back-office access is required" }, { status: 403 }),
  });
  await assert.rejects(client.list_drafts(), (error: unknown) => error instanceof Response && error.status === 403);
});

test("authentication lookup failures stop business requests before fetching", async () => {
  let fetched = false;
  const client = new BusinessClient({
    baseUrl: "https://hub.example/api",
    securityWorker: async () => { throw new Error("Session unavailable"); },
    customFetch: async () => { fetched = true; return Response.json({}); },
  });
  await assert.rejects(client.get_engagement_stats({ secure: false }), /Session unavailable/);
  assert.equal(fetched, false);
});
