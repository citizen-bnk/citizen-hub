import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { accountCatalog,safeReturn } from "@/lib/contracts";
import { authenticate,personForIdentity } from "@/lib/identity";
import { createSession } from "@/lib/session";
import { query,ServiceIssue } from "@/lib/db";
import { requireOrigin,failure } from "@/lib/http";
export async function POST(request:Request){try{
 requireOrigin(request);
 const input=z.object({email:z.string().email().optional(),password:z.string().min(1).max(1024).optional(),account:z.string().optional(),next:z.string().optional(),service:z.enum(["banking","app"]).optional()}).parse(await request.json());
 const isDemonstration=!!input.account;
 let email=input.email,password=input.password;
 if(isDemonstration){
  const account=accountCatalog.find(a=>a.key===input.account);
  if(process.env.DEMO_MODE!=="true"||!account)throw new ServiceIssue("DEMONSTRATION_DISABLED","Demonstration sign-in is not available.",403);
  email=`${account.key}@demo.citizenbank.test`;password=process.env.DEMO_ACCOUNT_PASSWORD;
 }
 if(!email||!password)throw new ServiceIssue("CREDENTIALS_REQUIRED","Enter your email and password.",422);
 const bucket=createHash("sha256").update((request.headers.get("x-forwarded-for")?.split(',')[0]||"local")+":"+email.toLowerCase()).digest("hex");
 const count=await query<{n:string}>("SELECT count(*) AS n FROM hub_auth_attempts WHERE bucket=$1 AND created_at>now()-interval '15 minutes'",[bucket]);
 if(Number(count[0].n)>=10)throw new ServiceIssue("SIGN_IN_RATE_LIMIT","Too many sign-in attempts. Please wait 15 minutes before retrying.",429);
 await query("INSERT INTO hub_auth_attempts(bucket) VALUES($1)",[bucket]);
 if(!isDemonstration&&email.endsWith('@demo.citizenbank.test'))throw new ServiceIssue('USE_DEMONSTRATION_SELECTOR','Choose the demonstration account selector for a fictional account.',422);
 const identity=await authenticate(email,password);
 const id=await personForIdentity(identity,isDemonstration);
 const memberships=await query<{role:string}>('SELECT role FROM hub_memberships WHERE person_id=$1 AND active',[id]);
 await createSession(id);
 return NextResponse.json({ok:true,next:input.service&&memberships.some(item=>item.role==='customer')?`/api/platform/handoff?audience=${input.service}`:safeReturn(input.next)},{headers:{"Cache-Control":"no-store"}});
}catch(error){return failure(error);}}
