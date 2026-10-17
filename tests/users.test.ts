import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { testDatabase, person } from "./support/database";
import { changeRoles, listUsers, roleChange, roleHistory } from "../lib/users";
import { ServiceIssue } from "../lib/db";
import { can, modules } from "../lib/contracts";

const issue = (code: string) => (e: unknown) => e instanceof ServiceIssue && e.code === code;
const change = (id: string, roles: string[], version: number, reason = "Joined the board") => roleChange.parse({ action: "roles", id, roles, version, reason, confirmed: true });

test("role change input is strict", () => {
  const id = randomUUID();
  assert.ok(roleChange.safeParse({ action: "roles", id, roles: ["investor"], version: 1, reason: "Joined the board", confirmed: true }).success);
  for (const bad of [{ roles: [] }, { roles: ["root"] }, { reason: "short" }, { confirmed: false }, { extra: 1 }]) {
    assert.ok(!roleChange.safeParse({ action: "roles", id, roles: ["investor"], version: 1, reason: "Joined the board", confirmed: true, ...bad }).success, JSON.stringify(bad));
  }
  assert.deepEqual(roleChange.parse({ action: "roles", id, roles: ["staff", "investor", "staff"], version: 1, reason: "Normalised roles", confirmed: true }).roles, ["investor", "staff"]);
});

test("only administrators see the users workspace", () => {
  const users = modules.find((m) => m.id === "users")!;
  assert.ok(can(["admin"], users.roles) && can(["super_admin"], users.roles));
  assert.ok(!can(["back_office"], users.roles) && !can(["investor"], users.roles));
});

test("role administration against the real schema", async () => {
  const db = await testDatabase();
  const admin = await person(db, "Ada Admin", ["admin"]);
  const root = await person(db, "Rae Root", ["super_admin"]);
  const target = await person(db, "Thabo Target", ["investor"]);
  const other = await person(db, "Neo Other", ["investor"]);

  assert.equal((await listUsers(admin)).length, 4);
  await assert.rejects(() => changeRoles(other, change(target.id, ["board_member"], 1)), issue("ROLE_ADMIN_REQUIRED"));

  await db.query("INSERT INTO hub_sessions(token_hash,person_id,expires_at) VALUES('t1',$1,now()+interval '1 hour')", [target.id]);
  await changeRoles(admin, change(target.id, ["investor", "board_member"], 1));
  const [row] = (await listUsers(admin)).filter((u) => u.id === target.id);
  assert.deepEqual(row.roles, ["board_member", "investor"]);
  assert.equal(row.version, 2);
  const session = await db.query<{ revoked_at: Date | null }>("SELECT revoked_at FROM hub_sessions WHERE token_hash='t1'");
  assert.notEqual(session.rows[0].revoked_at, null, "the person's other sessions are signed out");
  const history = await roleHistory(admin, target.id);
  assert.equal(history[0].reason, "Joined the board");
  assert.equal(history[0].actor, "Ada Admin");
  assert.ok((await db.query("SELECT 1 FROM hub_audit WHERE action='administrator.roles_changed'")).rows.length === 1);

  await assert.rejects(() => changeRoles(admin, change(target.id, ["investor"], 1)), issue("RECORD_CONFLICT"), "stale version is refused");
  await assert.rejects(() => changeRoles(admin, change(admin.id, ["admin", "board_member"], 1)), issue("SELF_ACCESS_PROTECTED"), "nobody grants themselves new roles");
  await assert.rejects(() => changeRoles(admin, change(other.id, ["super_admin"], 1)), issue("SUPER_ADMIN_REQUIRED"), "only a super administrator grants super admin");
  await changeRoles(root, change(other.id, ["super_admin"], 1, "Second owner for continuity"));
  await assert.rejects(() => changeRoles(admin, change(other.id, ["investor"], 2)), issue("SUPER_ADMIN_REQUIRED"), "an ordinary admin cannot demote a super admin");
  await assert.rejects(() => changeRoles(root, change(root.id, ["investor"], 1)), issue("SELF_ACCESS_PROTECTED"));
});
