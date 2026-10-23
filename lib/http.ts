import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ServiceIssue } from "./db";
export function requireOrigin(request:Request){
 const origin=request.headers.get("origin");
 if(!origin||origin!==new URL(request.url).origin)throw new ServiceIssue("REQUEST_ORIGIN_REJECTED","This action must be started from Citizen Hub.",403);
}
export function failure(error:unknown){
 if(error instanceof ServiceIssue)return NextResponse.json({error:error.message,code:error.code,recovery:error.status===401?"sign_in":error.status===403?"back":error.status===409?"reload":error.status===422?"edit":"retry"},{status:error.status,headers:{"Cache-Control":"no-store"}});
 if(error instanceof SyntaxError)return NextResponse.json({error:"The request could not be read. Check the information and submit again.",code:"INVALID_REQUEST_JSON",recovery:"edit"},{status:400});
 if(error instanceof ZodError)return NextResponse.json({error:error.issues[0]?.message||"Check the information and try again.",code:"VALIDATION_FAILED",recovery:"edit"},{status:422});
 console.error("[citizen] request failed",{category:error instanceof Error?error.name:"Unknown"});
 return NextResponse.json({error:"This request could not be completed. Retry or return to the previous screen.",code:"REQUEST_FAILED",recovery:"retry"},{status:500});
}
