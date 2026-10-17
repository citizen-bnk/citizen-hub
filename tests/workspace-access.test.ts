import { test } from "node:test";
import assert from "node:assert/strict";
import { can, modules } from "../lib/contracts";

const visibleTo = (roles: string[]) => modules.filter((m) => can(roles, m.roles)).map((m) => m.id);

test("investor workspaces are scoped to the right roles", () => {
  const investor = visibleTo(["investor"]);
  for (const id of ["opportunities", "subscriptions", "dataroom"]) assert.ok(investor.includes(id as never), `investor sees ${id}`);
  for (const id of ["review", "activity"]) assert.ok(!investor.includes(id as never), `investor must not see ${id}`);
  assert.deepEqual(visibleTo(["customer"]).filter((id) => ["opportunities", "subscriptions", "dataroom", "review", "activity"].includes(id)), []);
  const backOffice = visibleTo(["back_office"]);
  assert.ok(backOffice.includes("review") && backOffice.includes("activity") && backOffice.includes("dataroom"));
  assert.ok(!backOffice.includes("opportunities"), "reviewing does not imply investing");
  const staff = visibleTo(["staff"]);
  assert.ok(staff.includes("dataroom") && !staff.includes("review"));
  assert.ok(visibleTo(["super_admin"]).includes("review"));
});
