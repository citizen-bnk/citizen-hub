import {NextResponse} from 'next/server';
import {z} from 'zod';
import {identityConfiguration} from '@/lib/identity';
import {ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
export async function POST(req:Request){try{
 requireOrigin(req);const {code}=z.object({code:z.string().length(45)}).strict().parse(await req.json());
 const r=await fetch('https://api.stack-auth.com/api/v1/contact-channels/verify',{method:'POST',headers:identityConfiguration(),body:JSON.stringify({code}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new ServiceIssue('EMAIL_VERIFICATION_REJECTED','This email link could not be verified. It may have expired or already been used. Try signing in, or contact investor support.',422);
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
