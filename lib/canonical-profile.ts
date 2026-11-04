import 'server-only';
import {createHash,createHmac} from 'node:crypto';
import {ServiceIssue} from './db';
import type {Person} from './contracts';

type Canonical = {
  roles: Person['roles'];
  email: string;
  profile: Record<string, string | number | null>;
};
export async function canonicalProfile(subject: string, update?: Record<string,unknown>): Promise<Canonical> {
  const secret = process.env.PROFILE_SERVICE_SECRET;
  if (!secret || secret.length < 32) throw new ServiceIssue('PROFILE_CONNECTION_UNAVAILABLE','Shared Citizen profile access is unavailable. Retry.',503);
  const method = update ? 'PATCH' : 'GET';
  const body = update ? JSON.stringify(update) : '';
  const now = Math.floor(Date.now()/1000);
  const payload = Buffer.from(JSON.stringify({use:'profile',sub:subject,method,
    body:createHash('sha256').update(body).digest('hex'),iat:now,exp:now+30})).toString('base64url');
  const signature = createHmac('sha256',secret).update(payload).digest('base64url');
  const response = await fetch('https://citizenbank.co.ls/api/platform/subject-service',{
    method, headers:{'X-Citizen-Profile-Token':payload+'.'+signature,'Content-Type':'application/json'},
    body:update?body:undefined,cache:'no-store',signal:AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new ServiceIssue('SHARED_PROFILE_UNAVAILABLE',
    response.status===404?'Sign in on the Citizen Bank website first to link your shared profile.':
    response.status===403?'Your shared Citizen access is restricted. Contact an administrator.':
    'Your shared Citizen profile could not be loaded. Retry.',response.status===404||response.status===403?403:503);
  const result = await response.json() as Canonical & {provider_subject?:string};
  if (result.provider_subject !== subject || !Array.isArray(result.roles)
      || !result.roles.every(role=>typeof role==='string') || typeof result.email !== 'string'
      || !result.profile || !Number.isInteger(result.profile.version)) {
    throw new ServiceIssue('SHARED_PROFILE_INVALID','Your shared identity response could not be verified. Retry.',503);
  }
  return result;
}
export async function withCanonicalProfile(person:Person):Promise<Person>{
  if(person.scope!=='live')return person;
  const shared=await canonicalProfile(person.provider_subject);
  const profile=shared.profile;
  return {...person,roles:shared.roles,email:shared.email,
    display_name:String(profile.full_name||person.display_name),
    phone:String(profile.phone||''),country:String(profile.country||''),
    street_address:String(profile.street_address||''),city:String(profile.city||''),
    employer:String(profile.employer||''),occupation:String(profile.occupation||''),
    bio:String(profile.bio||''),version:Number(profile.version),
    role_profiles:{...person.role_profiles,investor:{
      source_of_funds:String(profile.source_of_funds||''),
      investor_type:String(profile.investor_type||''),
      investment_purpose:String(profile.investment_purpose||''),
    }}};
}
