import { NextResponse } from "next/server";
import { requirePerson } from "@/lib/session";
import { bankingHandoff } from "@/lib/handoff";
import { failure } from "@/lib/http";
import { ServiceIssue } from "@/lib/db";
export async function GET(request:Request){try{const audience=new URL(request.url).searchParams.get('audience');if(audience!=='banking'&&audience!=='app')throw new ServiceIssue('INVALID_SERVICE','Choose a valid Citizen service.',422);return NextResponse.redirect(await bankingHandoff(await requirePerson(),audience));}catch(error){if(error instanceof ServiceIssue&&error.status===401)return NextResponse.redirect(new URL('/login',request.url));return failure(error);}}
