import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {importPKCS8,SignJWT} from 'jose';
import {z} from 'zod';
import {publicKeys} from './handoff';
import {query,ServiceIssue} from './db';
import {can,type Person} from './contracts';
export const aiPreferences=z.object({language:z.enum(['en','st','zu']),theme:z.enum(['dark','light']),readAloud:z.boolean()}).strict();
export type AIPreferences=z.infer<typeof aiPreferences>;
export async function preferences(person:Person):Promise<AIPreferences>{
 const [row]=await query<{preferences:{ai?:unknown}}>('SELECT preferences FROM hub_people WHERE id=$1 AND scope=$2',[person.id,person.scope]);
 const parsed=aiPreferences.safeParse(row?.preferences?.ai);return parsed.success?parsed.data:{language:'en',theme:'dark',readAloud:false};
}
export async function aiRequest(person:Pick<Person,'id'|'scope'>&{roles?:Person['roles']},input:Record<string,unknown>,service:'ai'|'cards'='ai'){
 if(service==='cards'&&!can(person.roles||[],['admin']))throw new ServiceIssue('CARD_ADMIN_ACCESS_DENIED','Only administrators can manage cards.',403);
 const base=process.env.CORE_API_URL,pem=process.env.PLATFORM_SIGNING_KEY?.replace(/\\n/g,'\n'),issuer=process.env.PLATFORM_ISSUER?.replace(/\/+$/,'');
 if(!base||!pem||!issuer){const missing=[!base&&'Core service address',!pem&&'Hub signing identity',!issuer&&'platform issuer'].filter(Boolean).join(', ');throw new ServiceIssue(service==='cards'?'CARD_CONNECTION_UNAVAILABLE':'AI_CONNECTION_UNAVAILABLE','The shared Core connection is missing '+missing+'. Ask an administrator to update the Hub connection and redeploy; other services remain available.');}
 const raw=JSON.stringify(input),kid=(await publicKeys()).keys[0].kid;
 const token=await new SignJWT({use:service==='cards'?'institutional_cards':'institutional_ai',...(service==='cards'?{authority:'card_admin'}:{}),body:createHash('sha256').update(raw).digest('hex'),data_scope:person.scope==='demonstration'?'demo':'live'}).setProtectedHeader({alg:'ES256',kid}).setSubject(person.id).setAudience('citizen-core-'+service).setIssuer(issuer).setJti('ai:'+randomUUID().replace(/-/g,'')).setIssuedAt().setNotBefore('0s').setExpirationTime('60s').sign(await importPKCS8(pem,'ES256'));
 let response:Response;try{response=await fetch(new URL('/api/institutional-'+service,base),{method:'POST',headers:{'Content-Type':'application/json','X-Citizen-AI-Token':token},body:raw,cache:'no-store',signal:AbortSignal.timeout(55000)});}catch{throw new ServiceIssue('CORE_CONNECTION_INTERRUPTED','The shared Core service could not be reached. Retry or go back.');}
 if(!response.ok){const data=await response.json().catch(()=>({}));const code=typeof data.code==='string'?data.code:'AI_UNAVAILABLE';throw new ServiceIssue(code,typeof data.error==='string'?data.error:'CitizenAI is temporarily unavailable. Your other services remain available.',response.status);}
 return response;
}
export async function aiContext(person:Person){
 const admin=can(person.roles,['admin']);
 const [tasks,projects]=await Promise.all([
  query('SELECT title,status,due_at,module FROM hub_tasks WHERE owner_id=$1 AND scope=$2 LIMIT 20',[person.id,person.scope]),
  query('SELECT title,summary,status FROM hub_projects WHERE scope=$1 AND published AND ($2::boolean OR allowed_roles && $3::text[]) LIMIT 10',[person.scope,admin,person.roles])
 ]);
 const website=(process.env.NEXT_PUBLIC_WEBSITE_URL||'https://citizenbank.co.ls').replace(/\/$/,'');
 return JSON.stringify({controls:{investmentSource:'The original Citizen Bank website and its database are the authority for invitations, subscriptions, payments, cap table and board matters. Historical Hub investor records are held for reconciliation only. No current investor amounts or identities are provided in this chat context. Never invent a balance, payment, shareholding, agreement or action result. Send the user to the original website to review the record and complete the action.',investmentTasks:'Hub investment task execution is paused. Explain the action and link to the website workflow; do not claim that you performed it.'},tasks,projects,scope:person.scope,roles:person.roles,navigation:{investments:website+'/invest',subscriptions:website+'/my-subscriptions',investmentAdministration:admin?website+'/back-office-subscriptions':null,board:website+'/board-portal',boardAdministration:admin?website+'/back-office-board-members':null,applications:website+'/careers',profile:website+'/profile',banking:website+'/enter-banking'}}).slice(0,12000);
}
