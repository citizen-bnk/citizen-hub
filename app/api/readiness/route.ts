import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {ServiceIssue,query} from '@/lib/db';
import {audited} from '@/lib/audit';
import {driveReference} from '@/lib/contracts';
import {managesReadiness,mayVerify,mayRetest,reviewsEvidence} from '@/lib/readiness-policy';
import type {ReadinessItem,Finding} from '@/lib/readiness';
const inputSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('update_item'),id:z.string().uuid(),version:z.number().int().positive(),status:z.enum(['open','in_progress','submitted']),replacement_value:z.string().trim().max(2000),evidence_link:z.string().trim().max(1000),review_note:z.string().trim().max(2000),due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(''))}),
 z.object({action:z.literal('verify_item'),id:z.string().uuid(),version:z.number().int().positive()}),
 z.object({action:z.literal('create_finding'),system:z.enum(['website','hub','banking','app','core','evidence']),title:z.string().trim().min(5).max(200),details:z.string().trim().min(10).max(4000),severity:z.enum(['low','medium','high','critical'])}),
 z.object({action:z.literal('update_finding'),id:z.string().uuid(),version:z.number().int().positive(),status:z.enum(['triaged','fixed','retested']),resolution_note:z.string().trim().min(5).max(2000)}),
 z.object({action:z.literal('grant_review'),email:z.string().email(),source_id:z.string().uuid(),expires_at:z.string().datetime(),drive_access_checked:z.literal(true)}),
 z.object({action:z.literal('revoke_review'),person_id:z.string().uuid(),source_id:z.string().uuid()}),
]);
export async function POST(request:Request) {try {
 requireOrigin(request);const person=await requirePerson();const raw=await request.text();if(raw.length>16000)throw new ServiceIssue('VALIDATION_FAILED','Shorten the update.',422);const input=inputSchema.parse(JSON.parse(raw));
 if(input.action==='update_item'||input.action==='verify_item') {
  if(!managesReadiness(person.roles))throw new ServiceIssue('READINESS_ACCESS_DENIED','This account cannot change company licensing records.',403);
  const item=(await query<ReadinessItem>('SELECT * FROM hub_readiness_items WHERE id=$1 AND scope=$2',[input.id,person.scope]))[0];
  if(!item)throw new ServiceIssue('ITEM_UNAVAILABLE','This licensing item is not available to your account.',404);
  if(item.version!==input.version)throw new ServiceIssue('ITEM_CHANGED','Another user changed this item. Reload it before saving.',409);
  let rows;
  if(input.action==='verify_item') {
   if(!mayVerify(person.roles,person.id,item.submitted_by,item.status))throw new ServiceIssue('INDEPENDENT_REVIEW_REQUIRED','A different authorised reviewer must verify a submitted item.',403);
   rows=await audited("UPDATE hub_readiness_items SET status='verified',verified_by=$4,verified_at=now(),version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND version=$3 AND status='submitted' AND submitted_by<>$4 AND evidence_link IS NOT NULL AND replacement_value<>'' RETURNING *",[input.id,person.scope,input.version,person.id],person,'verify_readiness','readiness_item');
  } else {
   let link:string|null=null;if(input.evidence_link){try{link=driveReference(input.evidence_link).url;}catch{throw new ServiceIssue('DRIVE_LINK_REQUIRED','Use a Google Drive file shared link as evidence.',422);}}
   if(input.status==='submitted'&&(!link||!input.replacement_value))throw new ServiceIssue('EVIDENCE_REQUIRED','Add the completed information and its Drive evidence before requesting verification.',422);
   rows=await audited('UPDATE hub_readiness_items SET status=$4,replacement_value=$5,evidence_link=$6,review_note=$7,due_date=$8,submitted_by=$9,verified_by=NULL,verified_at=NULL,version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND version=$3 RETURNING *',[input.id,person.scope,input.version,input.status,input.replacement_value,link,input.review_note,input.due_date||null,input.status==='submitted'?person.id:null],person,'update_readiness','readiness_item');
  }
  if(!rows.length)throw new ServiceIssue('ITEM_CHANGED','This item changed or no longer meets the verification conditions. Reload and retry.',409);
 } else if(input.action==='create_finding') {
  if(!reviewsEvidence(person.roles))throw new ServiceIssue('REVIEW_ACCESS_DENIED','This account cannot submit review findings.',403);
  if(!managesReadiness(person.roles)&&!person.roles.includes('board_member')){const [grant]=await query('SELECT 1 FROM hub_review_grants WHERE person_id=$1 AND scope=$2 AND revoked_at IS NULL AND expires_at>now() AND drive_access_checked LIMIT 1',[person.id,person.scope]);if(!grant)throw new ServiceIssue('REVIEW_ACCESS_DENIED','Your evidence release expired or was revoked. Ask an administrator to renew it.',403);}
  await audited('INSERT INTO hub_review_findings(author_id,system,title,details,severity,scope) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[person.id,input.system,input.title,input.details,input.severity,person.scope],person,'create_finding','review_finding');
 } else if(input.action==='update_finding') {
  const finding=(await query<Finding>('SELECT * FROM hub_review_findings WHERE id=$1 AND scope=$2',[input.id,person.scope]))[0];
  if(!finding||(!managesReadiness(person.roles)&&finding.author_id!==person.id))throw new ServiceIssue('FINDING_UNAVAILABLE','This finding is not available to your account.',404);
  if(!managesReadiness(person.roles)&&!person.roles.includes('board_member')){const [grant]=await query('SELECT 1 FROM hub_review_grants WHERE person_id=$1 AND scope=$2 AND revoked_at IS NULL AND expires_at>now() AND drive_access_checked LIMIT 1',[person.id,person.scope]);if(!grant)throw new ServiceIssue('REVIEW_ACCESS_DENIED','Your review access has expired or been revoked.',403);}
  const permitted=input.status==='retested'?mayRetest(person.roles,person.id,finding.author_id,finding.status):managesReadiness(person.roles);
  if(!permitted)throw new ServiceIssue('FINDING_ACTION_DENIED','Company staff manage remediation. The reporting reviewer records the retest after a fix.',403);
  const rows=await audited('UPDATE hub_review_findings SET status=$4,resolution_note=$5,version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND version=$3 RETURNING *',[input.id,person.scope,input.version,input.status,input.resolution_note],person,'update_finding','review_finding');
  if(!rows.length)throw new ServiceIssue('FINDING_CHANGED','This finding has changed. Reload before updating it.',409);
 } else {
  if(!person.roles.includes('super_admin')&&!person.roles.includes('admin'))throw new ServiceIssue('ADMIN_REQUIRED','Only an authorised administrator can manage reviewer access.',403);
  if(input.action==='grant_review') {
   const expiry=new Date(input.expires_at);if(expiry<=new Date()||expiry.getTime()>Date.now()+30*86400000)throw new ServiceIssue('INVALID_ACCESS_WINDOW','Choose an expiry within the next 30 days.',422);
   const reviewer=(await query<{id:string}>("SELECT id FROM hub_people WHERE lower(email)=lower($1) AND scope=$2 AND active",[input.email,person.scope]))[0];
   if(!reviewer)throw new ServiceIssue('REVIEWER_NOT_REGISTERED','Ask the reviewer to sign in with their existing Citizen account first, then retry.',404);
   const source=(await query<{id:string}>('SELECT id FROM hub_readiness_sources WHERE id=$1 AND scope=$2',[input.source_id,person.scope]))[0];if(!source)throw new ServiceIssue('SOURCE_UNAVAILABLE','This source is not available in your workspace.',404);
   const [membership]=await query("SELECT 1 FROM hub_memberships WHERE person_id=$1 AND active AND role='regulatory_reviewer'",[reviewer.id]);if(!membership)throw new ServiceIssue('REVIEWER_ROLE_REQUIRED','Assign the regulatory reviewer role in User access before releasing evidence.',422);
   await audited("INSERT INTO hub_review_grants(person_id,source_id,scope,expires_at,granted_by,drive_access_checked) VALUES($1,$2,$3,$4,$5,true) ON CONFLICT(person_id,source_id) DO UPDATE SET expires_at=EXCLUDED.expires_at,granted_by=EXCLUDED.granted_by,granted_at=now(),revoked_at=NULL,drive_access_checked=true RETURNING person_id AS id",[reviewer.id,source.id,person.scope,expiry.toISOString(),person.id],person,'grant_review','reviewer');
  } else {
   await audited('UPDATE hub_review_grants SET revoked_at=now() WHERE person_id=$1 AND source_id=$2 AND scope=$3 RETURNING person_id AS id',[input.person_id,input.source_id,person.scope],person,'revoke_review','reviewer');
  }
 }
 return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
} catch(error){return failure(error);}}
