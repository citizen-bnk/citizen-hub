import assert from "node:assert/strict";
import { test } from "node:test";
import { BOUNCE_PARAM, localReturn, withParam, withoutParam } from "../src/platform/auth/signin";

const ORIGIN = "https://hub.citizenbank.co.ls";

test("the bounce marker is added and removed without disturbing the address", () => {
  const url = `${ORIGIN}/meetings?tab=2#notes`;
  const marked = withParam(url, BOUNCE_PARAM);
  assert.equal(new URL(marked).searchParams.get(BOUNCE_PARAM), "1");
  assert.equal(withoutParam(marked, BOUNCE_PARAM), url);
});

test("after signing in the Hub only returns to its own pages", () => {
  assert.equal(localReturn(`${ORIGIN}/portfolio?x=1`, ORIGIN), "/portfolio?x=1");
  assert.equal(localReturn("/meetings", ORIGIN), "/meetings");
  for (const bad of [null, "", "https://evil.example/x", "//evil.example", "javascript:alert(1)", "/\\evil.example"]) assert.equal(localReturn(bad, ORIGIN), "/");
});
