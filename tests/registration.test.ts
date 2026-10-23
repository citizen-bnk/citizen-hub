import {test} from "node:test";
import assert from "node:assert/strict";
import {registrationDestination,registrationInput} from "../lib/registration";

const valid={firstName:"Palesa",lastName:"Mokhethi",email:" PALESA@example.test ",password:"CitizenTest123",phone:"+266 5800 1234"};

test("registration normalises email and validates the customer-provided fields",()=>{
 const result=registrationInput.parse(valid);
 assert.equal(result.email,"palesa@example.test");
 assert.equal(result.firstName,"Palesa");
 assert.equal(result.phone,"+266 5800 1234");
});

test("registration rejects weak passwords and privilege injection",()=>{
 assert.throws(()=>registrationInput.parse({...valid,password:"short"}));
 assert.throws(()=>registrationInput.parse({...valid,password:"onlyletterslong"}));
 assert.throws(()=>registrationInput.parse({...valid,roles:["super_admin"]}));
});

test("new customer registrations return through canonical SSO to the requested banking host",()=>{
 assert.equal(registrationDestination("banking","/profile"),"/api/platform/handoff?audience=banking");
 assert.equal(registrationDestination("app","/profile"),"/api/platform/handoff?audience=app");
});

test("safe local next paths are retained only when no banking service was requested",()=>{
 assert.equal(registrationDestination(undefined,"/documents"),"/documents");
 assert.equal(registrationDestination(undefined,"//evil.test"),"/");
 assert.equal(registrationDestination(undefined,"javascript:alert(1)"),"/");
});
