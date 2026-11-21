import {requirePerson,requireRecentPerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {ServiceIssue} from '@/lib/db';
import {aiRequest} from '@/lib/citizen-ai';
export async function POST(request:Request){try{
 requireOrigin(request);
 const raw=await request.text();if(raw.length>4000)throw new ServiceIssue('VALIDATION_FAILED','Shorten the request.',422);
 const data=JSON.parse(raw);
 const person=data.action==='list'?await requirePerson():await requireRecentPerson('authorising pre-licensing testing');
 if(!person.roles.includes('super_admin'))throw new ServiceIssue('SUPER_ADMIN_REQUIRED','Only the Super Admin can authorise fictional banking.',403);
 const response=await aiRequest(person,data,'banking');
 return Response.json(await response.json(),{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
