import {NextResponse} from 'next/server';
import {query,ServiceIssue} from '@/lib/db';
import {verifyProfileProof} from '@/lib/profile-proof';
import {updateProfile,sharedProfile} from '@/lib/profile';
import {failure} from '@/lib/http';
import type {Person} from '@/lib/contracts';
async function handle(request:Request){try{const body=request.method==='PATCH'?await request.text():'';if(body.length>16000)throw new ServiceIssue('VALIDATION_FAILED','Profile update is too large.',422);const id=verifyProfileProof(request.headers.get('x-citizen-profile-token')||'',request.method,body,process.env.PROFILE_SERVICE_SECRET||'');if(!id)throw new ServiceIssue('PROFILE_PROOF_REJECTED','The authenticated profile request could not be verified.',401);
const rows=await query<Person>(`SELECT p.*,COALESCE((SELECT array_agg(role) FROM hub_memberships WHERE person_id=p.id AND active),ARRAY[]::text[]) AS roles FROM hub_people p WHERE p.id=$1 AND p.active`,[id]);let person=rows[0];if(!person)throw new ServiceIssue('PROFILE_NOT_LINKED','This identity has not been linked to Citizen Hub.',404);if(person.scope==='demonstration'&&process.env.DEMO_MODE!=='true')throw new ServiceIssue('DEMONSTRATION_DISABLED','Demonstration access is disabled.',403);
if(request.method==='PATCH')person=await updateProfile(person,JSON.parse(body));return NextResponse.json({linked:true,profile:sharedProfile(person),roles:person.roles},{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
export const GET=handle;
export const PATCH=handle;
