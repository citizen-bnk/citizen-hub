import 'server-only';
import {randomUUID} from 'node:crypto';
import {ServiceIssue} from './db';
import type {Person} from './contracts';
export function driveUploadReady(scope:Person['scope']){
 return !!(process.env.GOOGLE_DRIVE_CLIENT_ID&&process.env.GOOGLE_DRIVE_CLIENT_SECRET&&process.env.GOOGLE_DRIVE_REFRESH_TOKEN&&folder(scope)&& (scope!=='demonstration'||folder(scope)!==process.env.GOOGLE_DRIVE_RECRUITMENT_FOLDER_ID));
}
function folder(scope:Person['scope']){return scope==='demonstration'?process.env.GOOGLE_DRIVE_RECRUITMENT_DEMO_FOLDER_ID:process.env.GOOGLE_DRIVE_RECRUITMENT_FOLDER_ID;}
export async function uploadRecruitmentPDF(person:Pick<Person,'id'|'scope'>,name:string,file:File,purpose:'cv'|'references'|'selfie'|'id_photo'){
 if(!driveUploadReady(person.scope))throw new ServiceIssue('DRIVE_UPLOAD_UNAVAILABLE','Recruitment uploads are awaiting the Citizen Google Drive connection. Please retry later or contact recruitment support. Your application information has not been submitted.',503);
 const tokenReply=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_DRIVE_CLIENT_ID!,client_secret:process.env.GOOGLE_DRIVE_CLIENT_SECRET!,refresh_token:process.env.GOOGLE_DRIVE_REFRESH_TOKEN!,grant_type:'refresh_token'}),signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(!tokenReply.ok)throw new ServiceIssue('DRIVE_AUTHORISATION_REQUIRED','Citizen’s Google Drive connection needs administrator attention. Keep this form open and retry later.',503);
 const token=await tokenReply.json() as {access_token?:string};
 if(!token.access_token)throw new ServiceIssue('DRIVE_AUTHORISATION_REQUIRED','Citizen’s Google Drive connection could not be authorised. Retry later.',503);
 const parentReply=await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folder(person.scope)!)}?supportsAllDrives=true&fields=mimeType,trashed,capabilities(canAddChildren),permissions(type)`,{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(8000),cache:'no-store'});
 const parent=parentReply.ok?await parentReply.json() as {mimeType?:string;trashed?:boolean;capabilities?:{canAddChildren?:boolean};permissions?:{type:string}[]}:null;
 if(!parent||parent.trashed||parent.mimeType!=='application/vnd.google-apps.folder'||!parent.capabilities?.canAddChildren||!parent.permissions||parent.permissions.some(p=>['anyone','domain'].includes(p.type)))throw new ServiceIssue('DRIVE_FOLDER_REVIEW_REQUIRED','Recruitment storage needs a writable private Google Drive folder. An administrator must review its connection and access settings before you upload.',503);
 const boundary='citizen-'+randomUUID(),metadata={name:`${person.id}-${purpose}-${randomUUID()}-${name}`,parents:[folder(person.scope)!],appProperties:{citizen_owner:person.id,citizen_scope:person.scope,citizen_purpose:purpose}};
 const mime=purpose==='selfie'||purpose==='id_photo'?file.type:'application/pdf';
 const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,file,`\r\n--${boundary}--`]);
 const reply=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':`multipart/related; boundary=${boundary}`},body,signal:AbortSignal.timeout(25000)});
 if(!reply.ok)throw new ServiceIssue('DRIVE_UPLOAD_FAILED','Google Drive could not save this file. Keep the form open and retry the upload.',503);
 const saved=await reply.json() as {id?:string};
 if(!saved.id||!/^[\w-]+$/.test(saved.id))throw new ServiceIssue('DRIVE_UPLOAD_FAILED','Google Drive did not confirm a saved file. Retry the upload.',503);
 // Inherit the private recruitment folder permissions. Never create public-link permissions.
 return {fileId:saved.id,url:`https://drive.google.com/file/d/${saved.id}/view`};
}
