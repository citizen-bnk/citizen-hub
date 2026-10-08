import { NextResponse } from "next/server";
import { publicKeys } from "@/lib/handoff";
import { failure } from "@/lib/http";
export async function GET(){try{return NextResponse.json(await publicKeys(),{headers:{'Cache-Control':'public, max-age=60'}});}catch(error){return failure(error);}}
