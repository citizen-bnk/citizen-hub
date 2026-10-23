import {NextResponse} from "next/server";
import {requirePerson} from "@/lib/session";
import {bankingHandoff} from "@/lib/handoff";
import {failure} from "@/lib/http";
import {ServiceIssue} from "@/lib/db";

export async function GET(request:Request){
 try{
  const audience=new URL(request.url).searchParams.get("audience");
  if(audience!=="banking"&&audience!=="app")throw new ServiceIssue("INVALID_SERVICE","Choose a valid Citizen service.",422);
  const person=await requirePerson();
  if(!person.roles.includes("customer")){
   const next=audience==="app"?"/mobile-onboarding":"/banking-onboarding";
   return NextResponse.redirect(new URL(next,request.url));
  }
  return NextResponse.redirect(await bankingHandoff(person,audience));
 }catch(error){
  if(error instanceof ServiceIssue&&error.status===401){
   const audience=new URL(request.url).searchParams.get("audience")==="app"?"app":"banking";
   const next=audience==="app"?"/mobile-onboarding":"/banking-onboarding";
   return NextResponse.redirect(new URL(`/login?service=${audience}&next=${encodeURIComponent(next)}`,request.url));
  }
  return failure(error);
 }
}