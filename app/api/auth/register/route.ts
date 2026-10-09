import {NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {query,ServiceIssue} from '@/lib/db';
import {identityConfiguration} from '@/lib/identity';
import {recoveryOrigin} from '@/lib/password-recovery';
import {requireOrigin,failure} from '@/lib/http';
export const maxDuration=60;
const inputSchema=z.object({email:z.string().trim().email().max(254),password:z.string().min(12).max(128)}).strict();
export async function POST(req:Request){try{
 requireOrigin(req);const input=inputSchema.parse(await req.json());
 const email=input.email.toLowerCase();if(email.endsWith('@demo.citizenbank.test'))throw new ServiceIssue('USE_DEMONSTRATION_SELECTOR','Use the fictional account selector to try the system.',422);
 const bucket=createHash('sha256').update('signup:'+(req.headers.get('x-forwarded-for')?.split(',')[0]||'local')).digest('hex');
 await query('INSERT INTO hub_auth_attempts(bucket) VALUES($1)',[bucket]);
 const [count]=await query<{n:string}>("SELECT count(*) AS n FROM hub_auth_attempts WHERE bucket=$1 AND created_at>now()-interval '15 minutes'",[bucket]);
 if(Number(count.n)>5)throw new ServiceIssue('REGISTRATION_RATE_LIMIT','Too many registration attempts. Wait 15 minutes or sign in to your existing account.',429);
 const response=await fetch('https://api.stack-auth.com/api/v1/auth/password/sign-up',{method:'POST',headers:identityConfiguration(),body:JSON.stringify({email,password:input.password,verification_callback_url:recoveryOrigin(req.url,process.env.ACCOUNT_RECOVERY_ORIGIN||'https://hub.citizenbank.co.ls')+'/verify-email'}),cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok){const data=await response.json().catch(()=>({}));const code=typeof data.code==='string'?data.code:'';if(['USER_WITH_EMAIL_ALREADY_EXISTS','CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE'].includes(code))throw new ServiceIssue('ACCOUNT_ALREADY_EXISTS','An account already uses these login details. Sign in or reset your password to continue.',409);throw new ServiceIssue(response.status>=500?'REGISTRATION_UNAVAILABLE':'REGISTRATION_REJECTED',response.status>=500?'Registration is temporarily unavailable. Retry, or return to sign-in.':'The identity service could not create the account. Check the email and password requirements, or sign in if an account already exists.',response.status>=500?503:422);}
 // Provider email ownership is verified before activating a new investor. No provider tokens reach the browser.
 return NextResponse.json({ok:true,message:'Account created. Open the verification link in your email, then sign in to subscribe.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
