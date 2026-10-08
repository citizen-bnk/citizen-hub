import { NextResponse } from "next/server";
import { endSession } from "@/lib/session";
import { requireOrigin,failure } from "@/lib/http";
export async function POST(request:Request){try{requireOrigin(request);await endSession();return NextResponse.json({ok:true,next:process.env.NEXT_PUBLIC_WEBSITE_URL||"/login"});}catch(error){return failure(error);}}
