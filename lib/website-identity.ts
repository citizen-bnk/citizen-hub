import 'server-only';
import {identityConfiguration} from './identity';
import {query,ServiceIssue} from './db';
import type {Person} from './contracts';

/** A Stack bearer token identifies the same person on the original website and Hub. */
export async function websitePerson(authorization:string|null):Promise<Person|null>{
 if(!authorization)return null;
 const match=/^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization);
 if(!match)throw new ServiceIssue('WEBSITE_TOKEN_INVALID','Sign in again to view your investments.',401);
 let identity:{id?:string;primary_email?:string;primary_email_verified?:boolean;display_name?:string};
 try{
  const response=await fetch('https://api.stack-auth.com/api/v1/users/me',{headers:{...identityConfiguration(),'x-stack-access-token':match[1]},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new ServiceIssue('WEBSITE_TOKEN_REJECTED','Sign in again to view your investments.',401);
  identity=await response.json();
 }catch(error){if(error instanceof ServiceIssue)throw error;throw new ServiceIssue('IDENTITY_UNAVAILABLE','The identity service could not be reached. Retry in a moment.');}
 if(!identity.id||!identity.primary_email||identity.primary_email_verified!==true)throw new ServiceIssue('EMAIL_VERIFICATION_REQUIRED','Verify your email before accessing investments.',403);
 // Reading the website must never create an investor or claim a pending record.
 const rows=await query<Person>(`SELECT p.*,COALESCE((SELECT array_agg(role) FROM hub_memberships WHERE person_id=p.id AND active),ARRAY[]::text[]) AS roles FROM hub_people p WHERE p.provider_subject=$1 AND p.scope='live' AND p.active`,[identity.id]);
 return rows[0]||null;
}
