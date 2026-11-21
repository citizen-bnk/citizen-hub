import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {audited} from '@/lib/audit';
import {ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{
 requireOrigin(req);const person=await requirePerson(),{id}=await params;
 const input=z.object({version:z.number().int().positive()}).strict().parse(await req.json());
 const rows=await audited(`UPDATE hub_subscription_requests SET status='withdrawn',version=version+1 WHERE id=$1 AND person_id=$2 AND scope=$3 AND version=$4 AND status IN('submitted','under_review','awaiting_agreement','awaiting_payment') AND agreement_link IS NULL AND payment_link IS NULL RETURNING id`,[z.string().uuid().parse(id),person.id,person.scope,input.version],person,'subscription.withdrawn','subscription_request');
 if(!rows.length)throw new ServiceIssue('SUBSCRIPTION_WITHDRAWAL_UNAVAILABLE','The subscription changed, has agreement or payment evidence, or is unavailable to your account. Reload it or contact investor support; no withdrawal was recorded.',409);
 return NextResponse.json({ok:true});
 }catch(e){return failure(e);}}
