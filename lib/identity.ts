import "server-only";
import { query,ServiceIssue } from "./db";
type Identity={id:string;primary_email:string;display_name?:string};
function configuration(){
 let provider:Record<string,string>={};
 try {provider=(JSON.parse(process.env.AUTH_PROVIDERS||"[]") as {name:string;config:Record<string,string>}[]).find(p=>p.name==="stack-auth")?.config||{};}catch { /* Explicit configuration below still applies. */ }
 const id=process.env.STACK_PROJECT_ID||process.env.VITE_STACK_PROJECT_ID||provider.projectId;
 const key=process.env.STACK_PUBLISHABLE_CLIENT_KEY||process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY||provider.publishableClientKey;
 if(!id||!key)throw new ServiceIssue("IDENTITY_NOT_CONFIGURED","Citizen account sign-in is not configured.");
 return {"x-stack-project-id":id,"x-stack-publishable-client-key":key,"x-stack-access-type":"client","content-type":"application/json"};
}
function serverConfiguration(){
 const id=process.env.STACK_PROJECT_ID||process.env.VITE_STACK_PROJECT_ID;
 const key=process.env.STACK_SECRET_SERVER_KEY;
 if(!id||!key)throw new ServiceIssue("IDENTITY_NOT_CONFIGURED","Citizen account registration is not configured.");
 return {"x-stack-project-id":id,"x-stack-secret-server-key":key,"x-stack-access-type":"server","content-type":"application/json"};
}
export async function createIdentity(email:string,password:string,displayName:string):Promise<Identity>{
 try{
  const response=await fetch("https://api.stack-auth.com/api/v1/users",{method:"POST",headers:serverConfiguration(),body:JSON.stringify({primary_email:email,primary_email_auth_enabled:true,primary_email_verified:false,password,display_name:displayName}),cache:"no-store",signal:AbortSignal.timeout(10000)});
  const data=await response.json().catch(()=>({})) as {id?:string;primary_email?:string|null;display_name?:string|null;message?:string;error?:string;code?:string};
  if(!response.ok){
   if(response.status===409||response.status===422||/already.?exists|duplicate|email.*(used|taken)/i.test(`${data.message||""} ${data.error||""} ${data.code||""}`)){
    throw new ServiceIssue("ACCOUNT_EXISTS","That email may already have a Citizen account. Sign in with your existing account, or check your details.",409);
   }
   throw new ServiceIssue(response.status>=500?"IDENTITY_UNAVAILABLE":"REGISTRATION_REJECTED",response.status>=500?"Citizen account registration is temporarily unavailable. Please retry.":"Citizen account registration could not be completed. Check the details and try again.",response.status>=500?503:422);
  }
  if(!data.id)throw new ServiceIssue("IDENTITY_RESPONSE_INVALID","Citizen identity registration returned an incomplete response.");
  return {id:data.id,primary_email:(data.primary_email||email).toLowerCase(),display_name:data.display_name||displayName};
 }catch(error){if(error instanceof ServiceIssue)throw error;throw new ServiceIssue("IDENTITY_UNAVAILABLE","The Citizen identity service could not be reached. Please retry.");}
}
export async function authenticate(email:string,password:string):Promise<Identity>{
 try {
  const headers=configuration();
  const response=await fetch("https://api.stack-auth.com/api/v1/auth/password/sign-in",{method:"POST",headers,body:JSON.stringify({email,password}),cache:"no-store",signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new ServiceIssue(response.status<500?"SIGN_IN_REJECTED":"IDENTITY_UNAVAILABLE",response.status<500?"Sign-in could not be completed. Check your credentials; accounts requiring additional verification must use their supported sign-in flow.":"The Citizen identity service is unavailable. Please retry.",response.status<500?401:503);
  const tokens=await response.json() as {access_token?:string};
  if(!tokens.access_token)throw new ServiceIssue("IDENTITY_RESPONSE_INVALID","The identity service did not return a valid sign-in response.");
  const userResponse=await fetch("https://api.stack-auth.com/api/v1/users/me",{headers:{...headers,"x-stack-access-token":tokens.access_token},cache:"no-store",signal:AbortSignal.timeout(10000)});
  if(!userResponse.ok)throw new ServiceIssue("IDENTITY_VERIFICATION_FAILED","The identity service could not verify this account.");
  const identity=await userResponse.json() as Identity;
  if(!identity.id||!identity.primary_email)throw new ServiceIssue("IDENTITY_PROFILE_INCOMPLETE","This account needs a verified contact email before using Citizen Hub.",422);
  return identity;
 }catch(error){if(error instanceof ServiceIssue)throw error;throw new ServiceIssue("IDENTITY_UNAVAILABLE","The Citizen identity service could not be reached. Please retry.");}
}
export async function personForIdentity(identity:Identity,demonstration:boolean){
 const scope=demonstration?"demonstration":"live";
 const existing=await query<{id:string}>("SELECT id FROM hub_people WHERE provider_subject=$1 AND scope=$2 AND active",[identity.id,scope]);
 if(existing[0])return existing[0].id;
 if(demonstration)throw new ServiceIssue("ACCOUNT_NOT_SEEDED","This demonstration account has not been provisioned.");
 const created=await query<{id:string}>(`INSERT INTO hub_people(provider_subject,email,display_name,scope) VALUES($1,$2,$3,'live')
 ON CONFLICT(provider_subject,scope) DO UPDATE SET updated_at=now() RETURNING id`,[identity.id,identity.primary_email,identity.display_name||identity.primary_email.split("@")[0]]);
 return created[0].id;
}
