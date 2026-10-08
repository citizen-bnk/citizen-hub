import {NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {identityConfiguration} from '@/lib/identity';
import {query,ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
import {passwordProof,bindingMatches,recoveryOrigin} from '@/lib/password-recovery';
export const maxDuration=60;
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('send'),email:z.string().trim().email().max(254)}).strict(),
 z.object({action:z.literal('reset'),code:z.string().length(45),request_id:z.string().uuid(),password:z.string().min(12).max(128)}).strict(),
]);
const sent='If this email has a Citizen account, a recovery link has been sent. Check your inbox and spam folder.';
function result(message:string,warning?:string){return NextResponse.json({ok:true,message,...(warning?{warning}:{})},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){try{
 requireOrigin(req);const input=schema.parse(await req.json());
 const bucket=createHash('sha256').update('recovery:'+(req.headers.get('x-forwarded-for')?.split(',')[0]||'local')).digest('hex');
 await query('INSERT INTO hub_auth_attempts(bucket) VALUES($1)',[bucket]);
 const count=await query<{n:string}>("SELECT count(*) AS n FROM hub_auth_attempts WHERE bucket=$1 AND created_at>now()-interval '15 minutes'",[bucket]);
 if(Number(count[0].n)>5)throw new ServiceIssue('RECOVERY_RATE_LIMIT','Too many recovery attempts. Wait 15 minutes before trying again.',429);
 const headers=identityConfiguration();
 if(input.action==='send'){
  const email=input.email.toLowerCase();
  // Fictional identities have no recoverable mailbox. Do not change their shared demo credentials.
  if(email.endsWith('@demo.citizenbank.test'))return result(sent);
  const base=recoveryOrigin(req.url,process.env.ACCOUNT_RECOVERY_ORIGIN||'https://hub.citizenbank.co.ls');
  const row=(await query<{id:string}>("INSERT INTO hub_recovery_requests(email,expires_at) VALUES($1,now()+interval '1 hour') RETURNING id",[email]))[0];
  const response=await fetch('https://api.stack-auth.com/api/v1/auth/password/send-reset-code',{method:'POST',headers,body:JSON.stringify({email,callback_url:base+'/reset-password?request_id='+row.id}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new ServiceIssue('RECOVERY_UNAVAILABLE','The identity service could not send a recovery email. Retry, or return to sign-in.');
  return result(sent);
 }
 const record=(await query<{email:string;provider_subject:string|null}>(`SELECT r.email,p.provider_subject FROM hub_recovery_requests r LEFT JOIN hub_people p ON lower(p.email)=r.email AND p.scope='live' AND p.active WHERE r.id=$1 AND r.expires_at>now() AND r.completed_at IS NULL`,[input.request_id]))[0];
 if(!record)throw new ServiceIssue('RECOVERY_LINK_INVALID','This recovery request expired or was completed. Request a new recovery email.',422);
 const response=await fetch('https://api.stack-auth.com/api/v1/auth/password/reset',{method:'POST',headers,body:JSON.stringify({code:input.code,password:input.password}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok){
  if(response.status<500)throw new ServiceIssue('RECOVERY_LINK_INVALID','The recovery link is invalid, expired or already used, or the password was rejected. Choose a stronger password or request a new link.',422);
  throw new ServiceIssue('RECOVERY_UNAVAILABLE','The identity service could not complete the reset. Retry or request a new recovery link.');
 }
 // The provider's one-use email code authorises the reset. No login or role change follows.
 // Only revoke local sessions after independently verifying the recorded recipient's new password.
 try{
  const check=await fetch('https://api.stack-auth.com/api/v1/auth/password/sign-in',{method:'POST',headers,body:JSON.stringify({email:record.email,password:input.password}),cache:'no-store',signal:AbortSignal.timeout(10000)});
  const proof=passwordProof(check.status,await check.json().catch(()=>null));
  if(!bindingMatches(record.provider_subject||undefined,proof))throw new Error('Recipient verification unavailable');
  await query(`WITH revoked AS (UPDATE hub_sessions SET revoked_at=now() WHERE revoked_at IS NULL AND person_id IN(SELECT id FROM hub_people WHERE scope='live' AND provider_subject=$1) RETURNING token_hash) UPDATE hub_recovery_requests SET completed_at=now() WHERE id=$2`,[record.provider_subject,input.request_id]);
 }catch{
  // Never report a failed password reset after the provider has changed it, or suggest reusing its code.
  return result('Password updated for the account associated with the email link. Sign in with your new password.','We could not confirm that existing Hub sessions were signed out. Return to sign-in; contact support if this was a security-related reset.');
 }
 return result('Password updated. Sign in with your new password. Any additional account verification still applies.');
 }catch(e){if(e instanceof DOMException&&e.name==='TimeoutError')return failure(new ServiceIssue('RECOVERY_TIMEOUT','The identity service timed out. If you were saving a password, try signing in first; otherwise retry or request a new email.'));return failure(e);}}
