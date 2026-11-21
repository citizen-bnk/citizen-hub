import {timingSafeEqual} from 'node:crypto';
import {requirePerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
import {syncFormSubscriptions} from '@/lib/form-subscriptions';
export const maxDuration=60;
export async function POST(request:Request){try{requireOrigin(request);const p=await requirePerson();if(p.scope!=='live'||!can(p.roles,['admin']))throw new ServiceIssue('FORM_SYNC_ADMIN_REQUIRED','Only a live administrator can synchronise real Google Form responses.',403);return Response.json(await syncFormSubscriptions());}catch(error){return failure(error);}}
export async function GET(request:Request){const expected=process.env.CRON_SECRET,supplied=request.headers.get('authorization')||'';if(!expected||supplied.length!==('Bearer '+expected).length||!timingSafeEqual(Buffer.from(supplied),Buffer.from('Bearer '+expected)))return new Response('Unauthorised',{status:401});try{const result=await syncFormSubscriptions();return Response.json(result);}catch(error){return failure(error);}}
