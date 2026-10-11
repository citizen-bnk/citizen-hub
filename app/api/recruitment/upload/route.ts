import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {query,ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {driveUploadReady,uploadRecruitmentPDF} from '@/lib/drive-upload';
import {MAX_UPLOAD_BYTES,recruitmentFile} from '@/lib/upload-policy';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(){try{const p=await requirePerson();return Response.json({available:driveUploadReady(p.scope),maxBytes:MAX_UPLOAD_BYTES,types:['application/pdf']},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 requireOrigin(request);const person=await requirePerson();
 if(!driveUploadReady(person.scope))throw new ServiceIssue('DRIVE_UPLOAD_UNAVAILABLE','Citizen’s recruitment document storage is not connected yet. Keep your form open and retry later.',503);
 const length=Number(request.headers.get('content-length'));if(length>MAX_UPLOAD_BYTES+65536)throw new ServiceIssue('FILE_TOO_LARGE','Choose a PDF smaller than 3 MB.',422);
 const form=await request.formData(),purpose=z.enum(['cv','references']).parse(form.get('purpose')),file=form.get('file');
 if(!(file instanceof File))throw new ServiceIssue('FILE_REQUIRED','Choose your CV or references PDF to upload.',422);
 let name:string;try{name=recruitmentFile(file.name,file.type,file.size,new Uint8Array(await file.arrayBuffer()));}catch(e){throw new ServiceIssue('INVALID_FILE',e instanceof Error?e.message:'Choose a PDF smaller than 3 MB.',422);}
 const attempts=await query<{count:number}>("SELECT count(*)::int AS count FROM hub_audit WHERE actor_id=$1 AND scope=$2 AND action='recruitment.upload_started' AND created_at>now()-interval '1 hour'",[person.id,person.scope]);
 if(attempts[0]?.count>=20)throw new ServiceIssue('UPLOAD_LIMIT','Too many upload attempts. Please try again in an hour.',429);
 await query("INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) VALUES($1,'recruitment.upload_started','document',$2,$3)",[person.id,crypto.randomUUID(),person.scope]);
 const saved=await uploadRecruitmentPDF(person,name,file,purpose);
 await audited('INSERT INTO hub_documents(owner_id,name,drive_file_id,shared_link,category,scope) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[person.id,name,saved.fileId,saved.url,'recruitment_'+purpose,person.scope],person,'recruitment.file_uploaded','document');
 return Response.json({url:saved.url,name},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
