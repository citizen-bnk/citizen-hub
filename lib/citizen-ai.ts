import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {importPKCS8,SignJWT} from 'jose';
import {z} from 'zod';
import {publicKeys} from './handoff';
import {query,ServiceIssue} from './db';
import type {Person} from './contracts';
export const aiPreferences=z.object({language:z.enum(['en','st','zu']),theme:z.enum(['dark','light']),readAloud:z.boolean()}).strict();
export type AIPreferences=z.infer<typeof aiPreferences>;
export async function preferences(person:Person):Promise<AIPreferences>{
 const [row]=await query<{preferences:{ai?:unknown}}>('SELECT preferences FROM hub_people WHERE id=$1 AND scope=$2',[person.id,person.scope]);
 const parsed=aiPreferences.safeParse(row?.preferences?.ai);return parsed.success?parsed.data:{language:'en',theme:'dark',readAloud:false};
}
export async function aiRequest(person:Person,input:Record<string,unknown>){
 const base=process.env.CORE_API_URL,pem=process.env.PLATFORM_SIGNING_KEY?.replace(/\\n/g,'\n'),issuer=process.env.PLATFORM_ISSUER?.replace(/\/+$/,'');
 if(!base||!pem||!issuer)throw new ServiceIssue('AI_CONNECTION_UNAVAILABLE','CitizenAI’s shared Core connection is not configured. You can continue using the other Hub services.');
 const raw=JSON.stringify(input),kid=(await publicKeys()).keys[0].kid;
 const token=await new SignJWT({use:'institutional_ai',body:createHash('sha256').update(raw).digest('hex'),data_scope:person.scope==='demonstration'?'demo':'live'}).setProtectedHeader({alg:'ES256',kid}).setSubject(person.id).setAudience('citizen-core-ai').setIssuer(issuer).setJti('ai:'+randomUUID().replace(/-/g,'')).setIssuedAt().setNotBefore('0s').setExpirationTime('60s').sign(await importPKCS8(pem,'ES256'));
 let response:Response;try{response=await fetch(new URL('/api/institutional-ai',base),{method:'POST',headers:{'Content-Type':'application/json','X-Citizen-AI-Token':token},body:raw,cache:'no-store',signal:AbortSignal.timeout(55000)});}catch{throw new ServiceIssue('AI_CONNECTION_INTERRUPTED','CitizenAI could not reach the shared AI service. Retry, or continue in your workspace.');}
 if(!response.ok){const data=await response.json().catch(()=>({}));const code=typeof data.code==='string'?data.code:'AI_UNAVAILABLE';throw new ServiceIssue(code,typeof data.error==='string'?data.error:'CitizenAI is temporarily unavailable. Your other services remain available.',response.status);}
 return response;
}
export async function aiContext(person:Person){
 const offers=await query('SELECT title,instrument,currency,unit_price,min_units,summary,disclosure FROM hub_opportunities WHERE scope=$1 AND status=\'open\' LIMIT 5',[person.scope]);
 const subscriptions=await query('SELECT id,status,units,currency FROM hub_subscription_requests WHERE person_id=$1 AND scope=$2 ORDER BY created_at DESC LIMIT 10',[person.id,person.scope]);
 return JSON.stringify({scope:person.scope,roles:person.roles,offers,ownSubscriptions:subscriptions,navigation:{investments:'/opportunities',portfolio:'/investors',applications:'/careers',profile:'/profile',documents:'/documents',banking:person.roles.includes('customer')?'/api/platform/handoff?audience=banking':null}}).slice(0,12000);
}
