import "server-only";
import { z } from "zod";
import { query, ServiceIssue } from "./db";
import { can, type Person } from "./contracts";

import { assignableRoles } from "./users-roles";
export { assignableRoles };

export const canAdminister = (person: Person) => can(person.roles, ["admin"]);

export const roleChange = z.object({
  action: z.literal("roles"),
  id: z.string().uuid(),
  roles: z.array(z.enum(assignableRoles)).min(1).max(10).transform((roles) => [...new Set(roles)].sort()),
  version: z.number().int().positive(),
  reason: z.string().trim().min(8).max(500),
  confirmed: z.literal(true),
}).strict();
export type RoleChange = z.infer<typeof roleChange>;

export type UserRow = { id: string; display_name: string; email: string; version: number; active: boolean; roles: string[]; last_sign_in: string | null };

export function listUsers(person: Person) {
  return query<UserRow>(
    `SELECT p.id,p.display_name,p.email,p.version,p.active,
            COALESCE((SELECT array_agg(role ORDER BY role) FROM hub_memberships WHERE person_id=p.id AND active),ARRAY[]::text[]) AS roles,
            (SELECT max(created_at) FROM hub_sessions WHERE person_id=p.id) AS last_sign_in
       FROM hub_people p WHERE p.scope=$1 ORDER BY p.display_name LIMIT 500`,
    [person.scope],
  );
}

/** Messages for the codes returned by the database function hub_assign_roles, which holds the authoritative rules. */
const outcomes: Record<string, [string, number]> = {
  USER_UNAVAILABLE: ["This user is no longer available.", 404],
  ROLE_ADMIN_REQUIRED: ["Only administrators can change roles.", 403],
  RECORD_CONFLICT: ["Someone else changed this user. Reload to see their current roles.", 409],
  ROLE_INVALID: ["Choose at least one valid role.", 422],
  SUPER_ADMIN_REQUIRED: ["Only a super administrator can grant or remove the super administrator role.", 403],
  OWNER_ACCESS_PROTECTED: ["The owner’s access is protected and cannot be reduced here.", 403],
  SELF_ACCESS_PROTECTED: ["You cannot change your own roles. Ask another administrator.", 403],
};

export async function changeRoles(person: Person, input: RoleChange) {
  if (!canAdminister(person)) throw new ServiceIssue("ROLE_ADMIN_REQUIRED", outcomes.ROLE_ADMIN_REQUIRED[0], 403);
  // The database only stops people removing their own roles; granting yourself new ones (a board vote, say) is blocked here too.
  if (input.id === person.id) throw new ServiceIssue("SELF_ACCESS_PROTECTED", outcomes.SELF_ACCESS_PROTECTED[0], 403);
  const rows = await query<{ result: string }>(
    "SELECT hub_assign_roles($1::uuid,$2::uuid,$3::int,$4::text[],$5::text) AS result",
    [person.id, input.id, input.version, input.roles, input.reason],
  );
  const result = rows[0]?.result;
  if (result === "OK") return;
  const [message, status] = outcomes[result ?? ""] ?? ["The roles could not be changed.", 422];
  throw new ServiceIssue(result ?? "ROLE_CHANGE_FAILED", message, status);
}

export function roleHistory(person: Person, id: string) {
  return query<{ previous_roles: string[]; assigned_roles: string[]; reason: string; created_at: string; actor: string }>(
    `SELECT h.previous_roles,h.assigned_roles,h.reason,h.created_at,a.display_name AS actor FROM hub_role_history h JOIN hub_people a ON a.id=h.actor_id
      WHERE h.person_id=$1 AND h.scope=$2 ORDER BY h.id DESC LIMIT 10`, [id, person.scope]);
}
