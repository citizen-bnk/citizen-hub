import {test} from "node:test";
import assert from "node:assert/strict";
import {registrationRole,safeReturn} from "../lib/contracts";

test("banking and app onboarding are customer registrations, not investor registrations",()=>{
 assert.equal(registrationRole("/banking-onboarding"),"customer");
 assert.equal(registrationRole("/mobile-onboarding"),"customer");
 assert.equal(registrationRole("/banking-onboarding?continue=1"),"customer");
});
test("registration role rejects unsafe return destinations",()=>{
 assert.equal(registrationRole("//banking-onboarding"),"investor");
 assert.equal(safeReturn("https://example.test"),"/");
});
