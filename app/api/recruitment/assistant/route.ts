import {z} from 'zod';
import {createHash} from 'node:crypto';
import {currentPerson} from '@/lib/session';
import {applicantDraft} from '@/lib/applicant-intake';
import {requireOrigin,failure} from '@/lib/http';
import {query,ServiceIssue} from '@/lib/db';
import {aiRequest} from '@/lib/citizen-ai';
export const maxDuration=60;
export async function POST(request:Request){try{
 requireOrigin(request);const raw=await request.text();if(raw.length>2500)throw new ServiceIssue('CHAT_TOO_LONG','Keep your help question under 800 characters.',422);
 const data=z.object({vacancy_id:z.string().uuid(),question:z.string().max(300),message:z.string().trim().min(1).max(800)}).strict().parse(JSON.parse(raw));
 const person=await currentPerson(),draft=person?null:await applicantDraft();if(!person&&draft?.vacancy_id!==data.vacancy_id)throw new ServiceIssue('APPLICATION_SESSION_EXPIRED','Start the application conversation before asking CitizenAI.',409);
 const scope=person?.scope||'live';const [v]=await query<{title:string;summary:string;requirements:string}>("SELECT title,summary,requirements FROM hub_vacancies WHERE id=$1 AND scope=$2 AND status='open' AND closes_at>now()",[data.vacancy_id,scope]);if(!v)throw new ServiceIssue('VACANCY_CLOSED','Return to Careers to choose an available position.',409);
 const bucket=createHash('sha256').update('applicant-ai:'+(request.headers.get('x-forwarded-for')?.split(',')[0]||'local')).digest('hex');const [count]=await query<{n:number}>("SELECT count(*)::int AS n FROM hub_auth_attempts WHERE bucket=$1 AND created_at>now()-interval '1 hour'",[bucket]);if(count.n>=20)throw new ServiceIssue('CHAT_LIMIT','CitizenAI help reached its limit. Continue with the question hints or retry later.',429);await query('INSERT INTO hub_auth_attempts(bucket) VALUES($1)',[bucket]);
 const response=await aiRequest(person||{id:draft!.id,scope:'live'},{mode:'recruitment',language:'en',messages:[{role:'user',content:data.message}],context:JSON.stringify({employer:'Citizen Digital Ltd',position:v.title,summary:v.summary,requirements:v.requirements,question:data.question}).slice(0,12000)});
 const result=await response.json();return Response.json({reply:result.reply},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
