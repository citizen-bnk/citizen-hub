import { test } from "node:test";
import assert from "node:assert/strict";
import { testDatabase } from "./support/database";

test("Core's institutional migrations apply cleanly in order", async () => {
  const db = await testDatabase();
  const { rows } = await db.query<{ n: string }>("SELECT count(*) AS n FROM information_schema.tables WHERE table_name LIKE 'hub_%'");
  assert.ok(Number(rows[0].n) >= 40);
});
