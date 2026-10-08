import "server-only";
import { neon } from "@neondatabase/serverless";
export async function query<T=Record<string,unknown>>(statement:string,params:unknown[]=[]):Promise<T[]> {
 const url=process.env.DATABASE_URL;
 if(!url)throw new ServiceIssue("DATABASE_UNAVAILABLE","The institutional data service is not configured.");
 const readOnly=/^\s*SELECT\b/i.test(statement);
 for(let attempt=0;attempt<(readOnly?2:1);attempt++){
  try { return await neon(url,{fetchOptions:{signal:AbortSignal.timeout(6000)}}).query(statement,params) as T[]; }
  catch(error) { const issue=error as {code?:string;name?:string;sourceError?:{name?:string;cause?:{code?:string}}};const code=issue.code;
   console.error("[citizen] database request failed", {code:code||"NETWORK",category:issue.name,networkCode:issue.sourceError?.cause?.code});
   if(!code&&readOnly&&attempt===0)continue;
   if(code==='23505')throw new ServiceIssue('RECORD_CONFLICT','This record already exists. Reload to see its current state.',409);
   if(code==='23503')throw new ServiceIssue('RELATED_RECORD_UNAVAILABLE','The related record is no longer available. Reload before retrying.',409);
   if(code==='23514')throw new ServiceIssue('RECORD_VALIDATION_FAILED','The supplied information does not meet this record’s requirements.',422);
   throw new ServiceIssue(code==="42P01"?"SCHEMA_UNAVAILABLE":"DATABASE_UNAVAILABLE",code==="42P01"?"This service has not completed its database setup.":"The institutional data service could not be reached. Please retry.");
  }
 }
 throw new ServiceIssue('DATABASE_UNAVAILABLE','The institutional data service could not be reached. Please retry.');
}
export class ServiceIssue extends Error {constructor(public code:string,message:string,public status=503){super(message);}}
