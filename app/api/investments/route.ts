import {NextResponse} from 'next/server';
import {subscriptionInput as schema} from '@/lib/investment-policy';
import {requirePerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {requireOrigin,failure} from '@/lib/http';
async function ensureInvestorCompartment(personId:string,requestId:string,scope:string){
 // Derive profile values from the saved request on retries, never from changed client input.
 await query(`WITH request AS (SELECT person_id,source_of_funds,purpose FROM hub_subscription_requests WHERE id=$2 AND person_id=$1 AND scope=$3), membership AS (INSERT INTO hub_memberships(person_id,role) SELECT person_id,'investor' FROM request ON CONFLICT(person_id,role) DO NOTHING RETURNING person_id) UPDATE hub_people p SET role_profiles=jsonb_set(COALESCE(p.role_profiles,'{}'::jsonb),'{investor}',COALESCE(p.role_profiles->'investor','{}'::jsonb)||jsonb_build_object('source_of_funds',r.source_of_funds,'investment_purpose',r.purpose)),version=p.version+1,updated_at=now() FROM request r WHERE p.id=r.person_id AND p.scope=$3`,[personId,requestId,scope]);
}
export async function POST(req:Request){try{
 requireOrigin(req);const person=await requirePerson();
 if(!can(person.roles,['customer','investor','shareholder','board_member','staff','back_office','admin']))throw new ServiceIssue('INVESTMENT_ACCESS_REQUIRED','Use your own customer or investor account to submit a subscription request.',403);
 const input=schema.parse(await req.json());
 const existing=await query<{id:string}>('SELECT id FROM hub_subscription_requests WHERE person_id=$1 AND request_key=$2 AND scope=$3',[person.id,input.request_key,person.scope]);
 if(existing[0]){await ensureInvestorCompartment(person.id,existing[0].id,person.scope);return NextResponse.json({ok:true,id:existing[0].id,replayed:true});}
 const rows=await audited<{id:string}>(`INSERT INTO hub_subscription_requests(request_key,person_id,opportunity_id,opportunity_version,units,unit_price,currency,source_of_funds,purpose,scope) SELECT $1,$2,id,version,$3,unit_price,currency,$4,$5,scope FROM hub_opportunities WHERE id=$6 AND scope=$7 AND version=$8 AND status='open' AND $3 BETWEEN min_units AND max_units AND (closes_at IS NULL OR closes_at>now()) AND (scope='demonstration' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND terms_link IS NOT NULL)) ON CONFLICT(person_id,request_key) DO NOTHING RETURNING id`,[input.request_key,person.id,input.units,input.source_of_funds,input.purpose,input.opportunity_id,person.scope,input.version],person,'investment.requested','subscription_request');
 if(!rows[0]){const replay=await query<{id:string}>('SELECT id FROM hub_subscription_requests WHERE person_id=$1 AND request_key=$2 AND scope=$3',[person.id,input.request_key,person.scope]);if(replay[0]){await ensureInvestorCompartment(person.id,replay[0].id,person.scope);return NextResponse.json({ok:true,id:replay[0].id,replayed:true});}throw new ServiceIssue('OPPORTUNITY_CHANGED','This opportunity changed, closed, or the share quantity is outside its limits. Reload the opportunities before submitting again.',409);}
 // Requesting an investment adds only the investor compartment to this identity, never ownership or corporate privileges.
 await ensureInvestorCompartment(person.id,rows[0].id,person.scope);
 return NextResponse.json({ok:true,id:rows[0].id});
 }catch(e){return failure(e);}}

