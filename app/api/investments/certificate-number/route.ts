import {after} from 'next/server';
import {queueDocumentPack,processDocumentPack} from '@/lib/document-agent';
import {requireRecentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {failure,requireOrigin} from '@/lib/http';
import {certificateNumberInput} from '@/lib/certificate-number-policy';
export const maxDuration=300;
export async function POST(req:Request){try{requireOrigin(req);const p=await requireRecentPerson('assigning a certificate number');if(!can(p.roles,['admin']))throw new ServiceIssue('ADMIN_REQUIRED','Only an administrator can assign certificate numbers.',403);const d=certificateNumberInput.parse(await req.json());const [existing]=await query<{reference:string; base_reference:string; sequence:number}>('SELECT n.* FROM hub_subscription_certificate_numbers n JOIN hub_subscription_requests s ON s.id=n.subscription_id WHERE n.subscription_id=$1 AND s.scope=$2',[d.subscription_id,p.scope]);if(existing&&(existing.base_reference!==d.base_reference||(existing.sequence>0)!==d.topup))throw new ServiceIssue('CERTIFICATE_NUMBER_LOCKED','This subscription already has a permanent number. Keep it when revising documents.',409);const [r]=await query<{reference:string}>('SELECT hub_assign_subscription_certificate($1::uuid,$2,$3::uuid,$4,$5::boolean,$6) AS reference',[d.subscription_id,p.scope,p.id,d.base_reference,d.topup,d.note]);const job=await queueDocumentPack(p,d.subscription_id);after(()=>processDocumentPack(job));return Response.json({ok:true,reference:r.reference});}catch(e){return failure(e);}}
