import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePerson } from "@/lib/session";
import { ServiceIssue } from "@/lib/db";
import { can,canVote,driveReference } from "@/lib/contracts";
import { requireOrigin,failure } from "@/lib/http";
import {audited} from '@/lib/audit';
const inputSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('vote'),id:z.string().uuid(),choice:z.enum(['for','against','abstain'])}),
 z.object({action:z.literal('rsvp'),id:z.string().uuid(),response:z.enum(['accepted','declined','tentative'])}),
 z.object({action:z.literal('complete_task'),id:z.string().uuid()}),
 z.object({action:z.literal('read_notification'),id:z.string().uuid()}),
 z.object({action:z.literal('link_document'),name:z.string().trim().min(1).max(200),shared_link:z.string().url().max(1000),category:z.string().trim().min(1).max(100)}),
]);
export async function POST(request:Request){try{requireOrigin(request);const person=await requirePerson();const input=inputSchema.parse(await request.json());
 if(input.action==='vote'){
  if(!canVote(person.roles))throw new ServiceIssue('BOARD_ROLE_REQUIRED','Only permitted board members can vote.',403);
  const rows=await audited<{resolution_id:string}>(`INSERT INTO hub_votes(resolution_id,person_id,choice) SELECT id,$2,$3 FROM hub_resolutions WHERE id=$1 AND scope=$4 AND status='open' AND closes_at>now() ON CONFLICT(resolution_id,person_id) DO UPDATE SET choice=EXCLUDED.choice RETURNING resolution_id`,[input.id,person.id,input.choice,person.scope],person,input.action,'resolution','resolution_id');if(!rows.length)throw new ServiceIssue('VOTE_CLOSED','This resolution is unavailable or voting has closed.',409);
 }else if(input.action==='rsvp'){
  if(!can(person.roles,['board_member','staff','back_office']))throw new ServiceIssue('BOARD_ACCESS_REQUIRED','This account cannot respond to board invitations.',403);
  const rows=await audited(`INSERT INTO hub_meeting_responses(meeting_id,person_id,response) SELECT id,$2,$3 FROM hub_meetings WHERE id=$1 AND scope=$4 AND status='scheduled' ON CONFLICT(meeting_id,person_id) DO UPDATE SET response=EXCLUDED.response,updated_at=now() RETURNING meeting_id`,[input.id,person.id,input.response,person.scope],person,input.action,'meeting','meeting_id');if(!rows.length)throw new ServiceIssue('MEETING_UNAVAILABLE','This meeting is no longer available.',404);
 }else if(input.action==='complete_task'){
  const rows=await audited("UPDATE hub_tasks SET status='done' WHERE id=$1 AND owner_id=$2 AND scope=$3 RETURNING id",[input.id,person.id,person.scope],person,input.action,'task');if(!rows.length)throw new ServiceIssue('TASK_UNAVAILABLE','This task is not assigned to your account.',404);
 }else if(input.action==='read_notification'){
  const rows=await audited('UPDATE hub_notifications SET read_at=now() WHERE id=$1 AND person_id=$2 AND scope=$3 RETURNING id',[input.id,person.id,person.scope],person,input.action,'notification');if(!rows.length)throw new ServiceIssue('NOTIFICATION_UNAVAILABLE','This notification is not available to your account.',404);
 }else{
  if(!can(person.roles,['investor','shareholder','board_member','staff','back_office','admin']))throw new ServiceIssue('DOCUMENT_ACCESS_REQUIRED','This account cannot maintain institutional documents.',403);
  let reference;try{reference=driveReference(input.shared_link);}catch{throw new ServiceIssue('DRIVE_LINK_REQUIRED','Provide a valid Google Drive file shared link. Folder links and other storage providers are not accepted.',422);}
  const rows=await audited<{id:string}>('INSERT INTO hub_documents(owner_id,name,drive_file_id,shared_link,category,scope) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[person.id,input.name,reference.fileId,reference.url,input.category,person.scope],person,input.action,'document');
 }
 return NextResponse.json({ok:true});
}catch(error){return failure(error);}}
