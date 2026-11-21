import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {can,driveReference} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {requireOrigin,failure} from '@/lib/http';
const inputSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('question'),question:z.string().trim().min(3).max(4000)}).strict(),
 z.object({action:z.literal('answer'),id:z.string().uuid(),answer:z.string().trim().min(3).max(4000)}).strict(),
 z.object({action:z.literal('publish'),id:z.string().uuid(),publication:z.enum(['released','withdrawn'])}).strict(),
 z.object({action:z.literal('grant'),email:z.string().email(),stage:z.number().int().min(2).max(5),evidence:z.string().max(1000)}).strict(),
]);
export async function POST(req:Request){try{
 requireOrigin(req);const person=await requirePerson(),input=inputSchema.parse(await req.json());
 if(input.action==='question'){
 const [count]=await query<{n:string}>("SELECT count(*) AS n FROM hub_investor_questions WHERE person_id=$1 AND created_at>now()-interval '1 day'",[person.id]);if(Number(count.n)>=20)throw new ServiceIssue('QUESTION_LIMIT','You have reached today’s question limit. Review existing replies or contact investor support.',429);
 await audited('INSERT INTO hub_investor_questions(person_id,question,scope) VALUES($1,$2,$3) RETURNING id',[person.id,input.question,person.scope],person,'investor.question_submitted','investor_question');
 }else{
 if(!can(person.roles,['admin']))throw new ServiceIssue('DATA_ROOM_ADMIN_REQUIRED','Only administrators manage data room releases and replies.',403);
 if(input.action==='answer'){
 const rows=await audited('UPDATE hub_investor_questions SET answer=$1,answered_by=$2,answered_at=now() WHERE id=$3 AND scope=$4 RETURNING id',[input.answer,person.id,input.id,person.scope],person,'investor.question_answered','investor_question');if(!rows.length)throw new ServiceIssue('QUESTION_UNAVAILABLE','This question is unavailable. Reload the data room.',404);
 }else if(input.action==='publish'){
 const rows=await audited('UPDATE hub_data_room_documents SET publication=$1,updated_at=now() WHERE id=$2 AND scope=$3 RETURNING id',[input.publication,input.id,person.scope],person,'dataroom.publication_changed','data_room_document');if(!rows.length)throw new ServiceIssue('DOCUMENT_UNAVAILABLE','This document is unavailable. Reload the data room.',404);
 }else{
 let evidence:string;try{evidence=driveReference(input.evidence).url;}catch{throw new ServiceIssue('DOCUMENT_LINK_INVALID','Link the NDA, KYC clearance or approval evidence in Google Drive before granting access.',422);}
 const target=(await query<{id:string}>('SELECT id FROM hub_people WHERE lower(email)=lower($1) AND scope=$2 AND active',[input.email,person.scope]))[0];if(!target)throw new ServiceIssue('INVESTOR_NOT_FOUND','The investor must register before you can grant data room access.',422);
 await audited('INSERT INTO hub_data_room_access(person_id,stage,granted_by) VALUES($1,$2,$3) ON CONFLICT(person_id,stage) DO UPDATE SET granted_by=EXCLUDED.granted_by,granted_at=now() RETURNING person_id AS id',[target.id,input.stage,person.id],person,'dataroom.stage_'+input.stage+'_granted:'+evidence,'data_room_access');
 }
 }
 return NextResponse.json({ok:true});
 }catch(e){return failure(e);}}
