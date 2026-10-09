import "server-only";
import { randomUUID,createPublicKey } from "node:crypto";
import { importPKCS8,SignJWT,calculateJwkThumbprint } from "jose";
import type { Person } from "./contracts";
import { ServiceIssue } from "./db";
export async function publicKeys(){
 const pem=process.env.PLATFORM_SIGNING_KEY?.replace(/\\n/g,'\n');
 if(!pem)throw new ServiceIssue('HANDOFF_NOT_CONFIGURED','Citizen service switching is not configured.');
 const jwk=createPublicKey(pem).export({format:'jwk'});const kid=await calculateJwkThumbprint(jwk);
 return {keys:[{...jwk,kid,use:'sig',alg:'ES256'}]};
}
export async function bankingHandoff(person:Person,audience:'banking'|'app'){
 if(!person.roles.includes('customer'))throw new ServiceIssue('CUSTOMER_ROLE_REQUIRED','This identity does not include a banking customer role. Open a customer account through Internet Banking.',403);
 const pem=process.env.PLATFORM_SIGNING_KEY?.replace(/\\n/g,'\n'),issuer=process.env.PLATFORM_ISSUER?.replace(/\/+$/,'');
 const base=audience==='banking'?process.env.BANKING_URL:process.env.APP_URL;
 if(!pem||!issuer||!base)throw new ServiceIssue('HANDOFF_NOT_CONFIGURED','Citizen service switching is not configured.');
 const kid=(await publicKeys()).keys[0].kid;
 const token=await new SignJWT({use:'handoff',data_scope:person.scope==='demonstration'?'demo':'live',roles:person.roles,name:person.display_name,email:person.email}).setProtectedHeader({alg:'ES256',kid}).setSubject(person.id).setAudience(audience).setIssuer(issuer).setJti(randomUUID().replace(/-/g,'')).setIssuedAt().setNotBefore('0s').setExpirationTime('60s').sign(await importPKCS8(pem,'ES256'));
 const url=new URL('/sso',base);url.searchParams.set('code',token);url.searchParams.set('next','/');return url;
}
