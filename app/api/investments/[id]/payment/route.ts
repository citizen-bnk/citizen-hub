import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {driveReference} from '@/lib/contracts';
import {ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {requireOrigin,failure} from '@/lib/http';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{
 requireOrigin(req);const person=await requirePerson(),{id}=await params;
 const input=z.object({payment_link:z.string().url().max(1000)}).strict().parse(await req.json());
 let link:string;try{link=driveReference(input.payment_link).url;}catch{throw new ServiceIssue('DOCUMENT_LINK_INVALID','Use a Google Drive shared file link and grant your administrator Viewer access.',422);}
 const rows=await audited(`UPDATE hub_subscription_requests SET payment_link=$1,payment_authorisation_basis=NULL,payment_authorised_by=NULL,payment_authorised_at=NULL,version=version+1 WHERE id=$2 AND person_id=$3 AND scope=$4 AND status IN('submitted','under_review','awaiting_agreement','awaiting_payment') AND NOT EXISTS(SELECT 1 FROM hub_signing_requests r JOIN hub_documents d ON d.id=r.document_id WHERE d.subscription_id=hub_subscription_requests.id AND r.status IN('requested','processing')) RETURNING id`,[link,z.string().uuid().parse(id),person.id,person.scope],person,'subscription.payment_evidence_submitted','subscription_request');
 if(!rows.length)throw new ServiceIssue('PAYMENT_EVIDENCE_UNAVAILABLE','This subscription is unavailable or its review is complete. Open your subscription or contact investor support.',409);
 return NextResponse.json({ok:true,verified:false});
 }catch(e){return failure(e);}}
