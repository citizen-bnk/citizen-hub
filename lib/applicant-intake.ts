import 'server-only';
import {cookies} from 'next/headers';
import {randomBytes,createHash} from 'node:crypto';
import {query,ServiceIssue} from './db';
import {currentPerson} from './session';
import {applicantInput,suitabilityRequired} from './applicant-policy';
const cookie='citizen_recruitment_draft';
const digest=(v:string)=>createHash('sha256').update(v).digest('hex');
export async function applicantDraft(){const token=(await cookies()).get(cookie)?.value;if(!token)return null;return (await query<{id:string;vacancy_id:string}>('SELECT id,vacancy_id FROM hub_recruitment_drafts WHERE token_hash=$1 AND expires_at>now()',[digest(token)]))[0]||null;}
export async function startDraft(request:Request,vacancyId:string){
 const [v]=await query<{id:string}>("SELECT id FROM hub_vacancies WHERE id=$1 AND scope='live' AND status='open' AND closes_at>now()",[vacancyId]);if(!v)throw new ServiceIssue('VACANCY_CLOSED','This position has closed. Return to available positions.',409);
 const previous=await applicantDraft();if(previous?.vacancy_id===vacancyId)return previous;
 const bucket=digest('recruitment:'+ (request.headers.get('x-forwarded-for')?.split(',')[0]||'local'));
 const [n]=await query<{n:number}>("SELECT count(*)::int AS n FROM hub_auth_attempts WHERE bucket=$1 AND created_at>now()-interval '1 hour'",[bucket]);if(n.n>=15)throw new ServiceIssue('APPLICATION_RATE_LIMIT','Too many application attempts. Please retry in an hour.',429);
 await query('INSERT INTO hub_auth_attempts(bucket) VALUES($1)',[bucket]);
 const token=randomBytes(32).toString('base64url');const [draft]=await query<{id:string;vacancy_id:string}>('INSERT INTO hub_recruitment_drafts(token_hash,vacancy_id,expires_at) VALUES($1,$2,now()+interval \'4 hours\') RETURNING id,vacancy_id',[digest(token),vacancyId]);
 (await cookies()).set(cookie,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/recruitment',maxAge:14400});return draft;
}
export async function submitApplicant(input:unknown){
 const data=applicantInput.parse(input),p=await currentPerson(),draft=p?null:await applicantDraft();
 if(!p&&(!draft||draft.vacancy_id!==data.vacancy_id))throw new ServiceIssue('APPLICATION_SESSION_EXPIRED','Your application session expired. Restart the application and retry; your answers remain on this page.',409);
 const scope=p?.scope||'live';
 const [vacancy]=await query<{kind:string;title:string}>('SELECT kind,title FROM hub_vacancies WHERE id=$1 AND scope=$2',[data.vacancy_id,scope]);
 if(!vacancy)throw new ServiceIssue('VACANCY_CLOSED','This position is unavailable. Return to Careers.',409);
 if(suitabilityRequired(vacancy.kind,vacancy.title)&&!data.suitability)throw new ServiceIssue('SUITABILITY_REQUIRED','Complete the professional suitability declarations for this role.',422);
 // Only accept files uploaded by this identity or this guest capability; never trust supplied Drive URLs.
 for(const [purpose,url] of [['cv',data.cv_link],['references',data.references_link],['selfie',data.selfie_link],['id_photo',data.id_photo_link]])if(url){
 const files=p?await query('SELECT id FROM hub_documents WHERE owner_id=$1 AND scope=$2 AND category=$3 AND shared_link=$4',[p.id,scope,'recruitment_'+purpose,url]):await query('SELECT id FROM hub_recruitment_files WHERE draft_id=$1 AND purpose=$2 AND shared_link=$3',[draft!.id,purpose,url]);
 if(!files.length)throw new ServiceIssue('DOCUMENT_OWNERSHIP_REQUIRED','Upload your own application document before continuing.',422);}
 const previous=await query<{id:string}>('SELECT id FROM hub_job_applications WHERE scope=$1 AND request_key=$2 AND (person_id=$3::uuid OR guest_draft_id=$4::uuid)',[scope,data.request_key,p?.id||null,draft?.id||null]);if(previous[0])return previous[0];
 const snapshot={...data};
 const rows=await query<{id:string}>(`WITH changed AS (INSERT INTO hub_job_applications(scope,vacancy_id,person_id,request_key,cover_statement,cv_link,references_link,applicant_details,guest_draft_id,contact_verified) SELECT $1,v.id,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb,$8::uuid,false FROM hub_vacancies v WHERE v.id=$9 AND v.scope=$1 AND v.version=$10 AND v.status='open' AND v.closes_at>now() RETURNING *),event AS (INSERT INTO hub_recruitment_events(application_id,scope,actor_id,status,note) SELECT id,scope,person_id,status,'Application received. Contact and evidence verification remain pending.' FROM changed),logged AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT person_id,'recruitment.applied','application',id::text,scope FROM changed) SELECT id FROM changed`,[scope,p?.id||null,data.request_key,data.cover_statement,data.cv_link||null,data.references_link||null,JSON.stringify(snapshot),draft?.id||null,data.vacancy_id,data.vacancy_version]);
 if(!rows[0])throw new ServiceIssue('VACANCY_CHANGED','This vacancy changed or closed. Return to Careers to check the latest details.',409);return rows[0];
}
export async function claimApplications(personId:string,email:string){
 // Caller must have authenticated an identity with an explicitly verified email.
 await query(`WITH changed AS (UPDATE hub_job_applications a SET person_id=$1::uuid,contact_verified=true,version=version+1,updated_at=now() WHERE a.id IN (SELECT DISTINCT ON(vacancy_id) id FROM hub_job_applications WHERE scope='live' AND person_id IS NULL AND lower(applicant_details->>'email')=lower($2) ORDER BY vacancy_id,created_at,id) AND NOT EXISTS(SELECT 1 FROM hub_job_applications b WHERE b.person_id=$1::uuid AND b.vacancy_id=a.vacancy_id) RETURNING id,scope),logged AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $1::uuid,'recruitment.identity_verified','application',id::text,scope FROM changed) SELECT id FROM changed`,[personId,email]);
 await query("UPDATE hub_job_applications SET contact_verified=true WHERE person_id=$1 AND scope='live' AND lower(applicant_details->>'email')=lower($2)",[personId,email]);
}
