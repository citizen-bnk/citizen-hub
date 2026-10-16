import {z} from 'zod';
import {currentPerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {ServiceIssue} from '@/lib/db';
import {startDraft,submitApplicant} from '@/lib/applicant-intake';
export async function POST(request:Request){try{requireOrigin(request);const raw=await request.text();if(raw.length>30000)throw new ServiceIssue('APPLICATION_TOO_LARGE','Shorten your answers and retry.',422);const data=JSON.parse(raw);if(data.action==='start'){const id=z.string().uuid().parse(data.vacancy_id);if(!await currentPerson())await startDraft(request,id);return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}const result=await submitApplicant(data);return Response.json({ok:true,id:result.id},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
