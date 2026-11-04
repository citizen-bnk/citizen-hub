import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {query,ServiceIssue} from '@/lib/db';
import {updateProfile} from '@/lib/profile';
import {requireOrigin,failure} from '@/lib/http';
export async function POST(req:Request){try{requireOrigin(req);const p=await requirePerson();const d=z.object({full_name:z.string().trim().min(1).max(150),phone:z.string().max(30),country:z.string().trim().min(1).max(100),version:z.number().int().positive(),confirmed:z.literal(true),service:z.enum(['banking','app'])}).strict().parse(await req.json());
 const [restricted]=await query("SELECT 1 FROM hub_memberships WHERE person_id=$1 AND role='customer' AND NOT active",[p.id]);if(restricted)throw new ServiceIssue('CUSTOMER_ACCESS_REVIEW_REQUIRED','An administrator must review your previously revoked banking access before you enroll again.',403);
 await updateProfile(p,{full_name:d.full_name,phone:d.phone,country:d.country,version:d.version});
 const enrolled=await query(`WITH enrolled AS (INSERT INTO hub_memberships(person_id,role) VALUES($1,'customer') ON CONFLICT(person_id,role) DO UPDATE SET active=hub_memberships.active WHERE hub_memberships.active RETURNING person_id),logged AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT person_id,'banking.pre_licensing_enrolled','person',person_id::text,$2 FROM enrolled) SELECT person_id FROM enrolled`,[p.id,p.scope]);if(!enrolled.length)throw new ServiceIssue('CUSTOMER_ACCESS_REVIEW_REQUIRED','An administrator must review your revoked banking access.',403);
 return Response.json({ok:true,next:'/api/platform/handoff?audience='+d.service},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
