import assert from "node:assert/strict";
import { test } from "node:test";
import { BOUNCE_PARAM, localReturn, withParam, withoutParam } from "../src/hub/signin.js";

const ORIGIN = "https://hub.citizenbank.co.ls";

test("the bounce marker is added and removed without disturbing the address", () => {
  const url = `${ORIGIN}/board-portal?tab=2#notes`;
  const marked = withParam(url, BOUNCE_PARAM);
  assert.equal(new URL(marked).searchParams.get(BOUNCE_PARAM), "1");
  assert.equal(withoutParam(marked, BOUNCE_PARAM), url);
});

test("after signing in the Hub only returns to its own pages", () => {
  assert.equal(localReturn(`${ORIGIN}/my-subscriptions?x=1`, ORIGIN), "/my-subscriptions?x=1");
  assert.equal(localReturn("/board-portal", ORIGIN), "/board-portal");
  for (const bad of [null, "", "https://evil.example/x", "//evil.example", "javascript:alert(1)"]) {
    assert.equal(localReturn(bad, ORIGIN), "/");
  }
});
