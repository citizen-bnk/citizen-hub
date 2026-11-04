import {NextResponse} from 'next/server';
import {requirePerson} from '@/lib/session';
import {query,ServiceIssue} from '@/lib/db';
import {can} from '@/lib/contracts';
import {failure} from '@/lib/http';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{
 const person=await requirePerson(),{id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))throw new ServiceIssue('SUBSCRIPTION_NOT_FOUND','This subscription is unavailable to your account.',404);
 const [record]=await query('SELECT id,units,unit_price,currency,status,version,review_note FROM hub_subscription_requests WHERE id=$1 AND scope=$2 AND (person_id=$3 OR $4::boolean)',[id,person.scope,person.id,can(person.roles,['admin'])]);
 if(!record)throw new ServiceIssue('SUBSCRIPTION_NOT_FOUND','This subscription is unavailable to your account.',404);
 return NextResponse.json(record,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
