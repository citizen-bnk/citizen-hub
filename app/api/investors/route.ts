import {requirePerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
import {newInvestorInput} from '@/lib/investor-onboarding';
export async function POST(req:Request){try{
 requireOrigin(req);const actor=await requirePerson();if(!can(actor.roles,['admin']))throw new ServiceIssue('INVESTOR_ADMIN_REQUIRED','Only administrators can add investors.',403);
 const d=newInvestorInput.parse(await req.json());
 const existing=await query<{id:string;display_name:string;email:string;active:boolean}>('SELECT id,display_name,email,active FROM hub_people WHERE scope=$1 AND lower(email)=lower($2)',[actor.scope,d.email]);
 if(existing.length){if(existing.length!==1||!existing[0].active)throw new ServiceIssue('INVESTOR_REVIEW_REQUIRED','This email belongs to an inactive or ambiguous record. Review it in user administration.',409);return Response.json({person:existing[0],existing:true});}
 const rows=await query(`WITH person AS (INSERT INTO hub_people(id,provider_subject,email,display_name,phone,role_profiles,scope) VALUES($1::uuid,'pending-investor:'||$1::text,$2,$3,NULLIF($4,''),jsonb_build_object('investor',jsonb_build_object('legal_name',$3::text,'identity_reference',$5::text,'address',$6::text)),$7) ON CONFLICT DO NOTHING RETURNING id,display_name,email,scope),membership AS (INSERT INTO hub_memberships(person_id,role) SELECT id,'investor' FROM person),audit AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $8,'investor.pending_created','person',id::text,scope FROM person) SELECT id,display_name,email FROM person`,[d.request_key,d.email,d.display_name,d.phone,d.identity_reference,d.address,actor.scope,actor.id]);
 if(!rows.length)throw new ServiceIssue('INVESTOR_CHANGED','An investor with these details was just added. Retry to select the existing record.',409);
 return Response.json({person:rows[0],pending:true});
 }catch(e){return failure(e);}}
