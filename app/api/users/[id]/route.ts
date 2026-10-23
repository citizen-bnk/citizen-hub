import {z} from 'zod';
import {requirePerson,requireRecentPerson} from '@/lib/session';
import {can,type Person} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
import {updateProfile} from '@/lib/profile';
import {identityConfiguration} from '@/lib/identity';
import {recoveryOrigin} from '@/lib/password-recovery';
import {documentLimit} from '@/lib/document-limits';
export const maxDuration=60;
async function target(id:string,p:Person){if(!can(p.roles,['admin']))throw new ServiceIssue('PROFILE_ADMIN_REQUIRED','Only administrators can manage user profiles.',403);const [user]=await query<Person>(`SELECT p.*,ARRAY(SELECT role FROM hub_memberships m WHERE m.person_id=p.id AND m.active) AS roles FROM hub_people p WHERE p.id=$1 AND p.scope=$2 AND p.active`,[z.string().uuid().parse(id),p.scope]);if(!user)throw new ServiceIssue('USER_UNAVAILABLE','This user is not available in your environment.',404);return user;}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{requireOrigin(request);const actor=await requirePerson(),user=await target((await params).id,actor);await updateProfile(user,await request.json(),actor);return Response.json({ok:true});}catch(error){return failure(error);}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{requireOrigin(request);const actor=await requireRecentPerson('administrator password recovery'),user=await target((await params).id,actor);z.object({action:z.literal('send_reset'),confirmed:z.literal(true)}).strict().parse(await request.json());await documentLimit(actor.id,'admin-password-recovery');if(user.scope==='demonstration')throw new ServiceIssue('DEMO_RECOVERY_DISABLED','Fictional accounts have no recovery mailbox. Their shared demonstration passwords are not changed.',403);
 const [row]=await query<{id:string}>("INSERT INTO hub_recovery_requests(email,expires_at) VALUES($1,now()+interval '1 hour') RETURNING id",[user.email.toLowerCase()]);
 const response=await fetch('https://api.stack-auth.com/api/v1/auth/password/send-reset-code',{method:'POST',headers:identityConfiguration(),body:JSON.stringify({email:user.email,callback_url:recoveryOrigin(request.url,process.env.ACCOUNT_RECOVERY_ORIGIN||'https://hub.citizenbank.co.ls')+'/reset-password?request_id='+row.id}),cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new ServiceIssue('RECOVERY_UNAVAILABLE','The identity service could not accept the recovery email. Retry; no password was changed.',503);
 await query("INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) VALUES($1,'administrator.recovery_requested','person',$2,$3)",[actor.id,user.id,actor.scope]);return Response.json({ok:true,message:'The identity service accepted the recovery request for the existing login address. The user completes the reset from their email; no password was changed here.'});}catch(error){return failure(error);}}
