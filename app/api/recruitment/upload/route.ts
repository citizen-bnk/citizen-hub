import {z} from 'zod';
import {currentPerson} from '@/lib/session';
import {applicantDraft} from '@/lib/applicant-intake';
import {requireOrigin,failure} from '@/lib/http';
import {query,ServiceIssue} from '@/lib/db';
import {audited} from '@/lib/audit';
import {driveUploadReady,uploadRecruitmentPDF} from '@/lib/drive-upload';
import {MAX_UPLOAD_BYTES,recruitmentFile} from '@/lib/upload-policy';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(){try{const p=await currentPerson();return Response.json({available:driveUploadReady(p?.scope||'live'),maxBytes:MAX_UPLOAD_BYTES,types:['application/pdf']},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 requireOrigin(request);const person=await currentPerson(),draft=person?null:await applicantDraft();
 if(!person&&!draft)throw new ServiceIssue('APPLICATION_SESSION_EXPIRED','Restart the application before uploading your document.',409);
 const owner=person||{id:draft!.id,scope:'live' as const};
 if(!driveUploadReady(owner.scope))throw new ServiceIssue('DRIVE_UPLOAD_UNAVAILABLE','Citizen’s recruitment storage is not connected yet. You can submit your answers with CV evidence pending and provide it later.',503);
 const length=Number(request.headers.get('content-length'));if(length>MAX_UPLOAD_BYTES+65536)throw new ServiceIssue('FILE_TOO_LARGE','Choose a PDF smaller than 3 MB.',422);
 const form=await request.formData(),purpose=z.enum(['cv','references','selfie','id_photo']).parse(form.get('purpose')),file=form.get('file');
 if(!(file instanceof File))throw new ServiceIssue('FILE_REQUIRED','Choose your CV or references PDF to upload.',422);
 let name:string;try{const bytes=new Uint8Array(await file.arrayBuffer());if(purpose==='selfie'||purpose==='id_photo'){
 const jpeg=file.type==='image/jpeg'&&/\.jpe?g$/i.test(file.name)&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=file.type==='image/png'&&/\.png$/i.test(file.name)&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(file.size<16||file.size>MAX_UPLOAD_BYTES||!(jpeg||png))throw Error('Choose a JPEG or PNG photo smaller than 3 MB.');name=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
 }else name=recruitmentFile(file.name,file.type,file.size,bytes);}catch(e){throw new ServiceIssue('INVALID_FILE',e instanceof Error?e.message:'Choose a valid file smaller than 3 MB.',422);}
 const attempts=await query<{count:number}>("SELECT count(*)::int AS count FROM hub_audit WHERE resource_id=$1 AND scope=$2 AND action='recruitment.upload_started' AND created_at>now()-interval '1 hour'",[owner.id,owner.scope]);
 if(attempts[0]?.count>=20)throw new ServiceIssue('UPLOAD_LIMIT','Too many upload attempts. Please try again in an hour.',429);
 await query("INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) VALUES($1,'recruitment.upload_started','document',$2,$3)",[person?.id||null,owner.id,owner.scope]);
 const saved=await uploadRecruitmentPDF(owner,name,file,purpose);
 if(person)await audited('INSERT INTO hub_documents(owner_id,name,drive_file_id,shared_link,category,scope) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[person.id,name,saved.fileId,saved.url,'recruitment_'+purpose,person.scope],person,'recruitment.file_uploaded','document');
 else await query('INSERT INTO hub_recruitment_files(draft_id,purpose,name,drive_file_id,shared_link) VALUES($1,$2,$3,$4,$5)',[draft!.id,purpose,name,saved.fileId,saved.url]);
 return Response.json({url:saved.url,name},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
