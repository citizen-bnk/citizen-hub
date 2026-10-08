import "server-only";
import { cookies } from "next/headers";
import { randomBytes,createHash } from "node:crypto";
import { cache } from "react";
import { query,ServiceIssue } from "./db";
import type { Person } from "./contracts";
const name="citizen_hub_session";
const digest=(token:string)=>createHash("sha256").update(token).digest("hex");
export const currentPerson=cache(async():Promise<Person|null>=>{
 const token=(await cookies()).get(name)?.value;
 if(!token)return null;
 const rows=await query<Person>(`SELECT p.*,COALESCE((SELECT array_agg(role) FROM hub_memberships WHERE person_id=p.id AND active),ARRAY[]::text[]) AS roles
 FROM hub_sessions s JOIN hub_people p ON p.id=s.person_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND p.active`,[digest(token)]);
 const person=rows[0]||null;
 if(person?.scope==="demonstration"&&process.env.DEMO_MODE!=="true")return null;
 return person;
});
export async function requirePerson(){const person=await currentPerson();if(!person)throw new ServiceIssue("SIGN_IN_REQUIRED","Your session has ended. Sign in again to continue.",401);return person;}
export async function createSession(personId:string){
 const token=randomBytes(32).toString("base64url");
 await query("INSERT INTO hub_sessions(token_hash,person_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest(token),personId]);
 (await cookies()).set(name,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:28800});
}
export async function endSession(){const jar=await cookies();const token=jar.get(name)?.value;if(token)await query("UPDATE hub_sessions SET revoked_at=now() WHERE token_hash=$1",[digest(token)]);jar.delete(name);}
