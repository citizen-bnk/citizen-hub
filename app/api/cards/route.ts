import {z} from 'zod';
import {requireRecentPerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {can} from '@/lib/contracts';
import {ServiceIssue} from '@/lib/db';
import {aiRequest} from '@/lib/citizen-ai';
export async function POST(request:Request){try{requireOrigin(request);const person=await requireRecentPerson();if(!can(person.roles,['admin']))throw new ServiceIssue('CARD_ADMIN_ACCESS_DENIED','Only administrators can recover cards.',403);const raw=await request.text();if(raw.length>2500)throw new ServiceIssue('VALIDATION_FAILED','Shorten the recovery reason.',422);const data=z.object({action:z.enum(['restore','replace','archive','allow_forms','restrict_forms']),id:z.string().uuid(),expected_status:z.enum(['ACTIVE','FROZEN','BLOCKED','ORDERED']),expected_archived:z.boolean(),reason:z.string().trim().min(10).max(1000),confirmed:z.literal(true)}).strict().parse(JSON.parse(raw));const response=await aiRequest(person,data,'cards');return Response.json(await response.json(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
