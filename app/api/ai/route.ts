import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {aiRequest,aiContext} from '@/lib/citizen-ai';
export const maxDuration=60;
const input=z.discriminatedUnion('mode',[
 z.object({mode:z.literal('chat'),language:z.enum(['en','st','zu']),messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().trim().min(1).max(4000)}).strict()).min(1).max(20)}).strict(),
 z.object({mode:z.literal('speech'),language:z.enum(['en','st','zu']),text:z.string().trim().min(1).max(4000)}).strict(),
 z.object({mode:z.literal('status')}).strict()
]);
export async function POST(request:Request){try{
 requireOrigin(request);const person=await requirePerson();const raw=await request.text();if(raw.length>95000)return Response.json({error:'Start a new conversation; this one is too long.',code:'VALIDATION_FAILED'},{status:422});
 const data=input.parse(JSON.parse(raw));const response=await aiRequest(person,{...data,...(data.mode==='chat'?{context:await aiContext(person)}:{})});
 if(data.mode==='speech')return new Response(await response.arrayBuffer(),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
 const result=await response.json();return Response.json(data.mode==='chat'?{reply:result.reply}:result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
