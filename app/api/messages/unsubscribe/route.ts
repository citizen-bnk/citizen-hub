import {timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {unsubscribeToken} from '@/lib/messaging';
import {query} from '@/lib/db';
import {failure} from '@/lib/http';
export async function POST(request:Request){try{const url=new URL(request.url),id=z.string().uuid().parse(url.searchParams.get('person')),scope=z.enum(['live','demonstration']).parse(url.searchParams.get('scope'));const expected=Buffer.from(unsubscribeToken(id,scope)),received=Buffer.from(url.searchParams.get('token')||'');if(expected.length!==received.length||!timingSafeEqual(expected,received))return new Response('This unsubscribe link is invalid.',{status:403});await query("UPDATE hub_people SET preferences=jsonb_set(COALESCE(preferences,'{}'),'{investor_newsletters}','false'::jsonb) WHERE id=$1 AND scope=$2",[id,scope]);return new Response('You have unsubscribed from investor newsletters.');}catch(e){return failure(e);}}
export async function GET(request:Request){const url=new URL(request.url);return new Response('<!doctype html><html lang="en"><title>Citizen newsletter preference</title><body><h1>Unsubscribe from investor newsletters?</h1><form method="post"><button type="submit">Confirm unsubscribe</button></form></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}
