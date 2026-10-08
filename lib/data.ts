import "server-only";
import { query } from "./db";
import { can,type Person } from "./contracts";
export type Meeting={id:string;title:string;starts_at:string;ends_at:string;location:string;committee:string;status:string;agenda:{title:string;duration:number}[]};
export type Task={id:string;title:string;due_at:string|null;priority:string;status:string;module:string};
export type DocumentRecord={id:string;name:string;shared_link:string;category:string;version:number;classification:string;updated_at:string};
export type Investment={id:string;instrument:string;shares:number;amount:string;currency:string;status:string;created_at:string};
export type Resolution={id:string;title:string;description:string;status:string;closes_at:string;choice:string|null};
export type Notification={id:string;title:string;body:string;path:string;created_at:string;read_at:string|null};
export async function overview(person:Person){
 const [tasks,meetings,investments,documents,notifications,resolutions,capital,members]=await Promise.all([
  query<Task>("SELECT * FROM hub_tasks WHERE owner_id=$1 AND scope=$2 ORDER BY due_at NULLS LAST",[person.id,person.scope]),
  can(person.roles,["board_member","staff","back_office","admin"])?query<Meeting>("SELECT * FROM hub_meetings WHERE scope=$1 ORDER BY starts_at LIMIT 20",[person.scope]):Promise.resolve([]),
  query<Investment>("SELECT * FROM hub_investments WHERE person_id=$1 AND scope=$2 ORDER BY created_at DESC",[person.id,person.scope]),
  query<DocumentRecord>("SELECT id,name,shared_link,category,version,classification,updated_at FROM hub_documents WHERE scope=$1 AND (owner_id=$2 OR allowed_roles && $3::text[]) ORDER BY updated_at DESC",[person.scope,person.id,person.roles]),
  query<Notification>("SELECT * FROM hub_notifications WHERE person_id=$1 AND scope=$2 ORDER BY created_at DESC LIMIT 20",[person.id,person.scope]),
  can(person.roles,["board_member","staff","back_office","admin"])?query<Resolution>("SELECT r.*,v.choice FROM hub_resolutions r LEFT JOIN hub_votes v ON v.resolution_id=r.id AND v.person_id=$1 WHERE r.scope=$2 ORDER BY r.created_at DESC",[person.id,person.scope]):Promise.resolve([]),
  can(person.roles,["investor","shareholder","board_member","staff","back_office","admin"])?query<{received:string;committed:string;investors:string}>("SELECT COALESCE(sum(amount) FILTER(WHERE status IN ('received','issued')),0) AS received,COALESCE(sum(amount) FILTER(WHERE status NOT IN ('cancelled','pending')),0) AS committed,count(DISTINCT person_id) AS investors FROM hub_investments WHERE scope=$1",[person.scope]):Promise.resolve([]),
  can(person.roles,["board_member","staff","back_office","admin"])?query<{id:string;display_name:string}>("SELECT p.id,p.display_name FROM hub_people p JOIN hub_memberships m ON m.person_id=p.id WHERE p.scope=$1 AND p.active AND m.active AND m.role='board_member' ORDER BY p.display_name",[person.scope]):Promise.resolve([]),
 ]);
 return {tasks,meetings,investments,documents,notifications,resolutions,members,capital:capital[0]||{received:"0",committed:"0",investors:"0"}};
}
export type Overview=Awaited<ReturnType<typeof overview>>;
export const money=(amount:number|string,currency="LSL")=>new Intl.NumberFormat("en-ZA",{style:"currency",currency,maximumFractionDigits:0}).format(Number(amount));
