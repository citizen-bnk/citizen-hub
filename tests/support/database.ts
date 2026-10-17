import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { useTestExecutor } from "../../lib/db";

const schemaDir = join(__dirname, "..", "schema");

/** An in-memory Postgres with Core's institutional migrations applied in order, wired in as Hub's query function. */
export async function testDatabase() {
  const db = new PGlite();
  for (const file of readdirSync(schemaDir).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(schemaDir, file), "utf8"));
  }
  useTestExecutor(async (statement, params) => (await db.query(statement, params as unknown[])).rows);
  return db;
}

export async function person(db: PGlite, name: string, roles: string[], scope: "live" | "demonstration" = "demonstration") {
  const slug = name.toLowerCase().replace(/\W+/g, ".");
  const { rows } = await db.query<{ id: string }>(
    "INSERT INTO hub_people(provider_subject,email,display_name,scope) VALUES($1,$2,$3,$4) RETURNING id",
    [`sub-${slug}-${scope}`, `${slug}@example.test`, name, scope],
  );
  for (const role of roles) await db.query("INSERT INTO hub_memberships(person_id,role) VALUES($1,$2)", [rows[0].id, role]);
  return { id: rows[0].id, email: `${slug}@example.test`, display_name: name, roles, scope, version: 1 } as never as import("../../lib/contracts").Person;
}
