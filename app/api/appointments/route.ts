import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {appointmentInput,independentApprover} from '@/lib/appointment-policy';
export async function POST(request:Request){try{
 requireOrigin(request);const p=await requirePerson();if(!can(p.roles,['admin']))throw new ServiceIssue('ADMINISTRATION_ACCESS_DENIED','Only administrators can maintain corporate appointments.',403);
 const raw=await request.text();if(raw.length>15000)throw new ServiceIssue('VALIDATION_FAILED','Reduce the appointment notes before saving.',422);
 const d=appointmentInput.parse(JSON.parse(raw));
 if(d.action==='confirm'){
  const [r]=await query<{updated_by:string|null;status:string}>('SELECT updated_by,status FROM hub_corporate_records WHERE id=$1 AND scope=$2 AND kind=\'appointment\' AND version=$3',[d.id,p.scope,d.version]);
  if(!r)throw new ServiceIssue('APPOINTMENT_CHANGED','Reload the current appointment before confirming.',409);
  if(!independentApprover(r.updated_by,p.id))throw new ServiceIssue('INDEPENDENT_APPROVAL_REQUIRED','A different administrator must review and confirm this appointment. You cannot approve your own amendment.',403);
  if(!['work_in_progress','conflict'].includes(r.status))throw new ServiceIssue('APPOINTMENT_CHANGED','Only a pending appointment can be confirmed. Reload its current status.',409);
  const rows=await query(`WITH changed AS (UPDATE hub_corporate_records SET status='confirmed',facts=facts||jsonb_build_object('approval_link',$4::text,'regulatory_link',$5::text),review_note=$6,confirmed_by=$7,confirmed_at=now(),version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND kind='appointment' AND version=$3 AND updated_by IS DISTINCT FROM $7 AND updated_by IS NOT NULL AND status IN('work_in_progress','conflict') RETURNING *),history AS (INSERT INTO hub_corporate_history(record_id,version,actor_id,snapshot) SELECT id,version,$7,to_jsonb(changed) FROM changed),audit AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $7,'appointment.confirmed','appointment',id,scope FROM changed) SELECT id FROM changed`,[d.id,p.scope,d.version,d.approval_link,d.regulatory_link,d.review_note,p.id]);
  if(!rows[0])throw new ServiceIssue('APPOINTMENT_CHANGED','The appointment changed during review. Reload before continuing.',409);return Response.json({ok:true});
 }
 if(d.id&&!d.version)throw new ServiceIssue('APPOINTMENT_CHANGED','Reload before editing an appointment.',409);
 const linked=d.email?await query<{id:string}>('SELECT id FROM hub_people WHERE lower(email)=lower($1) AND scope=$2 AND active',[d.email,p.scope]):[];
 const facts=JSON.stringify({nominee:d.nominee,nominee_email:d.email,phase:d.phase,start_date:d.start_date});
 const rows=await query(`WITH changed AS (${d.id?`UPDATE hub_corporate_records SET title=$3,person_id=$4,facts=(facts-'approval_link'-'regulatory_link')||$5::jsonb,status=$6,source_link=$7,review_note=$8,updated_by=$9,confirmed_by=NULL,confirmed_at=NULL,version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND kind='appointment' AND version=$10 RETURNING *`:`INSERT INTO hub_corporate_records(id,reference,kind,title,person_id,facts,status,source_link,review_note,updated_by,scope) VALUES($1,'APPOINTMENT-'||$1::text,'appointment',$3,$4,$5::jsonb,$6,$7,$8,$9,$2) RETURNING *`}),history AS (INSERT INTO hub_corporate_history(record_id,version,actor_id,snapshot) SELECT id,version,$9,to_jsonb(changed) FROM changed),audit AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $9,'appointment.saved','appointment',id,scope FROM changed) SELECT id FROM changed`,[d.id??crypto.randomUUID(),p.scope,d.title,linked[0]?.id??null,facts,d.status,d.source_link,d.review_note,p.id,...(d.id?[d.version]:[])]);
 if(!rows[0])throw new ServiceIssue('APPOINTMENT_CHANGED','This appointment changed elsewhere. Reload before saving.',409);return Response.json({ok:true});
 }catch(e){return failure(e);}}
