import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {query,ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {apply,progress,candidateAction,recruiter} from '@/lib/recruitment';
import {vacancyInput,documentUpdate} from '@/lib/recruitment-policy';
export async function POST(request:Request){try{
 requireOrigin(request);const person=await requirePerson(),raw=await request.text();if(raw.length>25000)throw new ServiceIssue('VALIDATION_FAILED','This application is too large.',422);const input=JSON.parse(raw);
 if(input.action==='apply')return Response.json(await apply(person,input));
 if(input.action==='review')return Response.json(await progress(person,input));
 if(input.action==='documents'){const d=documentUpdate.parse(input);const rows=await audited(`UPDATE hub_job_applications SET cv_link=$4,references_link=$5,version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND person_id=$3 AND version=$6 AND status IN('submitted','under_review','shortlisted','interview','checks') RETURNING id`,[d.id,person.scope,person.id,d.cv_link,d.references_link||null,d.version],person,'recruitment.documents_updated','application');if(!rows[0])throw new ServiceIssue('APPLICATION_CHANGED','Documents can only be updated on your own application before an offer. Reload before retrying.',409);return Response.json({ok:true});}
 if(input.action==='candidate'){const d=z.object({action:z.literal('candidate'),id:z.string().uuid(),version:z.number().int().positive(),status:z.enum(['accepted','declined','withdrawn']),confirmed:z.literal(true)}).strict().parse(input);return Response.json(await candidateAction(person,d.id,d.version,d.status));}
 if(input.action==='notifications'){const d=z.object({action:z.literal('notifications'),enabled:z.boolean()}).strict().parse(input);await query("UPDATE hub_people SET preferences=jsonb_set(COALESCE(preferences,'{}'),'{career_updates}',$3::jsonb),updated_at=now() WHERE id=$1 AND scope=$2",[person.id,person.scope,JSON.stringify(d.enabled)]);return Response.json({ok:true});}
 if(!recruiter(person))throw new ServiceIssue('RECRUITMENT_ACCESS_DENIED','Only administrators can manage vacancies.',403);
 const d=z.object({action:z.literal('vacancy'),id:z.string().uuid().optional(),version:z.number().int().positive().optional(),vacancy:vacancyInput}).strict().parse(input),v=d.vacancy;
 if(v.status==='open'&&new Date(v.closes_at)<=new Date())throw new ServiceIssue('VACANCY_DEADLINE_PASSED','Choose a future closing date before publishing this vacancy.',422);
 if(d.id&&!d.version)throw new ServiceIssue('VALIDATION_FAILED','Reload the vacancy before editing.',422);
 const rows=await query<{id:string}>(`WITH changed AS (${d.id?`UPDATE hub_vacancies SET title=$3,summary=$4,requirements=$5,location=$6,kind=$7,phase=$8,closes_at=$9,source_link=$10,status=$11,published_at=CASE WHEN $11='open' THEN COALESCE(published_at,now()) ELSE published_at END,version=version+1,updated_at=now() WHERE id=$1 AND scope=$2 AND version=$12 AND (kind=$7 OR NOT EXISTS(SELECT 1 FROM hub_job_applications a WHERE a.vacancy_id=hub_vacancies.id)) RETURNING *`:`INSERT INTO hub_vacancies(id,scope,title,summary,requirements,location,kind,phase,closes_at,source_link,status,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $11='open' THEN now() ELSE NULL END) RETURNING *`}),logged AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $${d.id?13:12},'recruitment.vacancy_saved','vacancy',id,scope FROM changed) SELECT id FROM changed`,[d.id??crypto.randomUUID(),person.scope,v.title,v.summary,v.requirements,v.location,v.kind,v.phase,v.closes_at,v.source_link,v.status,...(d.id?[d.version]:[]),person.id]);
 if(!rows[0])throw new ServiceIssue('VACANCY_CHANGED','The vacancy changed elsewhere. Reload before saving.',409);
 return Response.json(rows[0]);
 }catch(e){return failure(e);}}
