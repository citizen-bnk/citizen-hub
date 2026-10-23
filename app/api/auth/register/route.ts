import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {requireOrigin,failure} from "@/lib/http";
import {query,ServiceIssue} from "@/lib/db";
import {createIdentity,authenticate,personForIdentity} from "@/lib/identity";
import {createSession} from "@/lib/session";
import {registrationDestination,registrationInput} from "@/lib/registration";

export async function POST(request:Request){
 try{
  requireOrigin(request);
  const input=registrationInput.parse(await request.json());
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
  const bucket=createHash("sha256").update(`register:${ip}:${input.email}`).digest("hex");
  const count=await query<{n:string}>("SELECT count(*) AS n FROM hub_auth_attempts WHERE bucket=$1 AND created_at>now()-interval '1 hour'",[bucket]);
  if(Number(count[0]?.n||0)>=5)throw new ServiceIssue("REGISTRATION_RATE_LIMIT","Too many attempts. Please wait before trying again.",429);
  await query("INSERT INTO hub_auth_attempts(bucket) VALUES($1)",[bucket]);

  const displayName=`${input.firstName} ${input.lastName}`.trim();
  let identity;
  try{
   identity=await createIdentity(input.email,input.password,displayName);
  }catch(error){
   // An existing identity may be adding banking access. Require its password before linking it.
   if(!(error instanceof ServiceIssue)||error.code!=="ACCOUNT_EXISTS")throw error;
   identity=await authenticate(input.email,input.password);
  }
  const personId=await personForIdentity(identity,false);
  await query("INSERT INTO hub_memberships(person_id,role,active) VALUES($1,'customer',TRUE) ON CONFLICT DO NOTHING",[personId]);
  if(input.phone)await query("UPDATE hub_people SET phone=$2,version=version+1,updated_at=now() WHERE id=$1",[personId,input.phone]);
  await createSession(personId);
  return NextResponse.json({ok:true,next:registrationDestination(input.service,input.next)},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return failure(error);}
}
