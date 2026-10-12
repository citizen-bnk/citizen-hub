import {z} from 'zod';
import {requirePerson,requireRecentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {requireOrigin,failure} from '@/lib/http';
import {documentLimit} from '@/lib/document-limits';
import {requestSignatures,authorise,completeSigning} from '@/lib/signing';
export const maxDuration=60;
export async function POST(request:Request){try{requireOrigin(request);const raw=await request.text();if(raw.length>10000)throw new ServiceIssue('VALIDATION_FAILED','Shorten the signing request.',422);const input=JSON.parse(raw),p=await requirePerson();await documentLimit(p.id,'signing');
 if(input.action==='request'){const d=z.object({action:z.literal('request'),confirmed:z.literal(true),data:z.unknown()}).strict().parse(input);return Response.json(await requestSignatures(p,d.data));}
 if(input.action==='authorise'){await requireRecentPerson('document signing');const d=z.object({action:z.literal('authorise'),id:z.string().uuid(),version:z.number().int().positive(),name:z.string().trim().min(3).max(200),confirmed:z.literal(true)}).strict().parse(input);return Response.json(await authorise(p,d.id,d.version,d.name,d.confirmed));}
 if(input.action==='retry'){const d=z.object({action:z.literal('retry'),id:z.string().uuid()}).strict().parse(input);const own=await query('SELECT r.id FROM hub_signing_requests r WHERE r.id=$1 AND r.scope=$2 AND ($3::boolean OR EXISTS(SELECT 1 FROM hub_signing_parties s WHERE s.request_id=r.id AND s.person_id=$4))',[d.id,p.scope,can(p.roles,['admin']),p.id]);if(!own.length)throw new ServiceIssue('SIGNING_UNAVAILABLE','This request is unavailable.',404);return Response.json(await completeSigning(p,d.id));}
 if(input.action==='revoke_signature'){await requireRecentPerson('document signing');await query("UPDATE hub_signature_assets SET revoked_at=now() WHERE owner_id=$1 AND scope=$2 AND revoked_at IS NULL",[p.id,p.scope]);return Response.json({ok:true});}
 if(!can(p.roles,['admin']))throw new ServiceIssue('SIGNING_ADMIN_REQUIRED','Only administrators can cancel signing requests.',403);const d=z.object({action:z.literal('cancel'),id:z.string().uuid(),version:z.number().int().positive()}).strict().parse(input);const rows=await query("UPDATE hub_signing_requests SET status='cancelled',version=version+1 WHERE id=$1 AND scope=$2 AND version=$3 AND status='requested' RETURNING id",[d.id,p.scope,d.version]);if(!rows.length)throw new ServiceIssue('SIGNING_REQUEST_CHANGED','A completed or processing request cannot be cancelled. Reload its status.',409);return Response.json({ok:true});
 }catch(e){return failure(e);}}
