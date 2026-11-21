import "server-only";
import {query,ServiceIssue} from "./db";
import type {Person} from "./contracts";

/** Customer access is a low-privilege membership. Financial products remain subject to Core KYC and licensing controls. */
export async function ensureCustomerMembership(person:Person):Promise<void>{
 await query(`WITH added AS (
   INSERT INTO hub_memberships(person_id,role,active)
   VALUES($1,'customer',TRUE)
   ON CONFLICT DO NOTHING
   RETURNING person_id
 ), logged AS (
   INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope)
   SELECT $1,'customer.access.enabled','person',person_id::text,$2 FROM added
   RETURNING id
 ) SELECT person_id FROM added`,[person.id,person.scope]);
 const rows=await query<{active:boolean}>("SELECT active FROM hub_memberships WHERE person_id=$1 AND role='customer' LIMIT 1",[person.id]);
 if(!rows[0]?.active)throw new ServiceIssue("CUSTOMER_ACCESS_DISABLED","Banking access is not enabled for this account. Please contact Citizen support.",403);
}
