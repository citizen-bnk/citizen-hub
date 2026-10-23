import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {aiPreferences,preferences} from '@/lib/citizen-ai';
import {query} from '@/lib/db';
export async function GET(){try{return Response.json(await preferences(await requirePerson()),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function PATCH(request:Request){try{requireOrigin(request);const person=await requirePerson(),data=aiPreferences.parse(await request.json());await query("UPDATE hub_people SET preferences=jsonb_set(COALESCE(preferences,'{}'::jsonb),'{ai}',$3::jsonb),updated_at=now() WHERE id=$1 AND scope=$2",[person.id,person.scope,JSON.stringify(data)]);return Response.json(data);}catch(e){return failure(e);}}
