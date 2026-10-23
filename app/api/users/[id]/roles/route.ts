import {z} from 'zod';
import {requireRecentPerson} from '@/lib/session';
import {query,ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
import {roleChange} from '@/lib/role-policy';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{requireOrigin(request);const actor=await requireRecentPerson('changing user roles');const id=z.string().uuid().parse((await params).id),input=roleChange.parse(await request.json());const [result]=await query<{result:string}>('SELECT hub_assign_roles($1,$2,$3,$4,$5) AS result',[actor.id,id,input.version,input.roles,input.reason]);if(result.result!=='OK')throw new ServiceIssue(result.result,result.result==='RECORD_CONFLICT'?'This profile changed. Reload before saving roles.':'This role change is not permitted. Super-admin access, your own access and environment boundaries are protected.',result.result==='RECORD_CONFLICT'?409:403);return Response.json({ok:true,message:'Roles saved. The user must sign in again to refresh their access.'});}catch(error){return failure(error);}}
