import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {can,driveReference} from '@/lib/contracts';
import {ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {requireOrigin,failure} from '@/lib/http';
const schema=z.object({id:z.string().uuid(),version:z.number().int().positive(),status:z.enum(['under_review','awaiting_agreement','awaiting_payment','received','pending_conversion','declined']),note:z.string().trim().min(3).max(2000),agreement_link:z.string().max(1000).optional(),payment_link:z.string().max(1000).optional(),invoice_link:z.string().max(1000).optional(),receipt_link:z.string().max(1000).optional(),certificate_preview_link:z.string().max(1000).optional(),settlement_confirmed:z.boolean().default(false)}).strict();
export async function POST(req:Request){try{
 requireOrigin(req);const person=await requirePerson();if(!can(person.roles,['admin']))throw new ServiceIssue('SUBSCRIPTION_REVIEW_DENIED','Only an administrator can review subscriptions. Return to your own subscription requests.',403);
 const input=schema.parse(await req.json());let agreement:string|null=null,payment:string|null=null;
 try{agreement=input.agreement_link?driveReference(input.agreement_link).url:null;payment=input.payment_link?driveReference(input.payment_link).url:null;}catch{throw new ServiceIssue('DOCUMENT_LINK_INVALID','Use a Google Drive shared file link for each agreement or payment record.',422);}
 if(['received','pending_conversion'].includes(input.status)&&!input.settlement_confirmed)throw new ServiceIssue('SETTLEMENT_CONFIRMATION_REQUIRED','Reconcile the amount, sender, reference and date against the receiving bank record before confirming receipt. Uploaded proof alone is insufficient.',422);
 let invoice:string|null=null,receipt:string|null=null,certificate:string|null=null;try{invoice=input.invoice_link?driveReference(input.invoice_link).url:null;receipt=input.receipt_link?driveReference(input.receipt_link).url:null;certificate=input.certificate_preview_link?driveReference(input.certificate_preview_link).url:null;}catch{throw new ServiceIssue('DOCUMENT_LINK_INVALID','Use Google Drive shared file links for the invoice, receipt and certificate preview.',422);}
 const rows=await audited<{id:string}>(`UPDATE hub_subscription_requests SET status=$1,review_note=$2,agreement_link=COALESCE($3,agreement_link),payment_link=COALESCE($4,payment_link),reviewed_by=$5,reviewed_at=now(),version=version+1,invoice_link=COALESCE($9,invoice_link),receipt_link=COALESCE($10,receipt_link),certificate_preview_link=COALESCE($11,certificate_preview_link) WHERE id=$6 AND scope=$7 AND version=$8 AND status NOT IN('withdrawn','declined') AND ($1 NOT IN('received','pending_conversion') OR (COALESCE($3,agreement_link) IS NOT NULL AND COALESCE($4,payment_link) IS NOT NULL)) RETURNING id`,[input.status,input.note,agreement,payment,person.id,input.id,person.scope,input.version,invoice,receipt,certificate],person,'subscription.reviewed','subscription_request');
 if(!rows.length)throw new ServiceIssue('SUBSCRIPTION_REVIEW_CONFLICT','The request changed, was closed, or lacks the signed agreement and verified payment evidence required for this status. Reload and check the evidence.',409);
 return NextResponse.json({ok:true});
 }catch(e){return failure(e);}}
