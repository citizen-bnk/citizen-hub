import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {requireRecentPerson} from '@/lib/session';
import {query,ServiceIssue} from '@/lib/db';
import {identityConfiguration} from '@/lib/identity';
import {requireOrigin,failure} from '@/lib/http';
import {documentLimit} from '@/lib/document-limits';
import type {Person} from '@/lib/contracts';
const inputSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('password'),password:z.string().min(12).max(128),version:z.number().int().positive(),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('email'),email:z.string().trim().email().max(254).transform(s=>s.toLowerCase()),version:z.number().int().positive(),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('reconcile'),confirmed:z.literal(true)}).strict()
]);
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{
 requireOrigin(request);const actor=await requireRecentPerson('changing login credentials');if(!actor.roles.includes('super_admin'))throw new ServiceIssue('SUPER_ADMIN_REQUIRED','Only super administrators can directly change login credentials.',403);
 const id=z.string().uuid().parse((await params).id),input=inputSchema.parse(await request.json());const [user]=await query<Person&{preferences:Record<string,unknown>}>("SELECT * FROM hub_people WHERE id=$1 AND scope=$2 AND active",[id,actor.scope]);if(!user)throw new ServiceIssue('USER_UNAVAILABLE','This user is unavailable.',404);
 if(user.scope!=='live')throw new ServiceIssue('DEMO_CREDENTIALS_PROTECTED','Shared demonstration credentials stay unchanged. Use a live account for credential administration.',403);
 if(input.action==='email'&&(user.email.toLowerCase()==='phafanep@gmail.com'||input.email==='phafanep@gmail.com'))throw new ServiceIssue('OWNER_IDENTITY_PROTECTED','The designated owner login cannot be reassigned. Update its contact information in the profile instead.',403);
 const secret=process.env.STACK_SECRET_SERVER_KEY;if(!secret)throw new ServiceIssue('IDENTITY_ADMIN_NOT_CONFIGURED','The shared identity server key is missing. No credentials were changed.',503);
 const headers={...identityConfiguration(),'x-stack-access-type':'server','x-stack-secret-server-key':secret},url='https://api.stack-auth.com/api/v1/users/'+encodeURIComponent(user.provider_subject);
 await documentLimit(actor.id,'admin-credentials');
 if(input.action==='reconcile'){
  if(user.preferences.credential_operation_at&&Date.now()-Date.parse(String(user.preferences.credential_operation_at))<120000)throw new ServiceIssue('CREDENTIAL_CHANGE_IN_PROGRESS','Wait two minutes for the current identity request before reconciling.',409);
  if(!user.preferences.credential_operation)return Response.json({ok:true,message:'No unfinished change needs reconciliation.'});
  const response=await fetch(url,{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new ServiceIssue('IDENTITY_UNAVAILABLE','Cannot reconcile identity details. Retry.',503);const remote=await response.json() as {primary_email:string};const email=z.string().email().parse(remote.primary_email).toLowerCase();
  await finish(id,actor.id,actor.scope,email,'administrator.credentials_reconciled',String(user.preferences.credential_operation));return Response.json({ok:true,message:'Login email reconciled with the identity service. A previous password change could not be confirmed; set a new password if needed.'});
 }
 const op=randomUUID();
 const [reserved]=await query<{id:string}>(`UPDATE hub_people SET preferences=preferences||jsonb_build_object('credential_operation',$4::text,'credential_operation_at',now()::text),version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND version=$3 AND NOT preferences ? 'credential_operation' AND ($5::text IS NULL OR NOT EXISTS(SELECT 1 FROM hub_people other WHERE other.scope=$2 AND lower(other.email)=lower($5) AND other.id<>$1)) RETURNING id`,[id,actor.scope,input.version,op,input.action==='email'?input.email:null]);
 if(!reserved)throw new ServiceIssue('CREDENTIAL_CHANGE_CONFLICT','Reload this profile. Its version, login email or an unfinished credential change needs review.',409);
 await query("INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) VALUES($1,'administrator.credentials_requested','person',$2,$3)",[actor.id,id,actor.scope]);
 let response:Response;try{response=await fetch(url,{method:'PATCH',headers,body:JSON.stringify(input.action==='password'?{password:input.password}:{primary_email:input.email,primary_email_verified:false,primary_email_auth_enabled:true}),cache:'no-store',signal:AbortSignal.timeout(20000)});}catch{throw new ServiceIssue('CREDENTIAL_CHANGE_UNCERTAIN','The identity service did not confirm the result. Click Reconcile login details before retrying. No success is assumed.',503);}
 if(!response.ok){await query("UPDATE hub_people SET preferences=preferences-'credential_operation'-'credential_operation_at' WHERE id=$1 AND preferences->>'credential_operation'=$2",[id,op]);throw new ServiceIssue('IDENTITY_CHANGE_REJECTED','The identity service rejected this change. Check the login address or password requirements and retry.',422);}
 await finish(id,actor.id,actor.scope,input.action==='email'?input.email:user.email,input.action==='password'?'administrator.password_changed':'administrator.login_email_changed',op);
 return Response.json({ok:true,message:input.action==='password'?'Password updated without a reset email. Hub sessions were revoked.':'Login email updated. The new address remains unverified until the user verifies it. Hub sessions were revoked.'});
 }catch(error){return failure(error);}}
async function finish(id:string,actor:string,scope:string,email:string,action:string,operation:string){const rows=await query(`WITH changed AS(UPDATE hub_people SET email=$4,preferences=(preferences-'credential_operation'-'credential_operation_at')||jsonb_build_object('credentials_revoked_before',now()::text),version=version+1,updated_at=now() WHERE id=$1 AND scope=$3 AND preferences->>'credential_operation'=$6 RETURNING id),revoked AS(UPDATE hub_sessions SET revoked_at=now() WHERE person_id IN(SELECT id FROM changed) AND revoked_at IS NULL RETURNING person_id) INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $2,$5,'person',id::text,$3 FROM changed RETURNING resource_id`,[id,actor,scope,email,action,operation]);if(!rows.length)throw new ServiceIssue('CREDENTIAL_CHANGE_CONFLICT','The pending change was already reconciled. Reload and check current login details.',409);}
