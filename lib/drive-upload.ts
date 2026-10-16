import 'server-only';
import {driveFolder,connectedDriveReady,refreshDriveToken} from './drive-connection';
import {randomUUID} from 'node:crypto';
import {ServiceIssue} from './db';
import type {Person} from './contracts';
export const driveUploadReady=(scope:Person['scope'])=>connectedDriveReady(scope,'recruitment');
const folder=(scope:Person['scope'])=>driveFolder(scope,'recruitment');
export async function uploadRecruitmentPDF(person:Pick<Person,'id'|'scope'>,name:string,file:File,purpose:'cv'|'references'|'selfie'|'id_photo'){
 if(!await driveUploadReady(person.scope))throw new ServiceIssue('DRIVE_UPLOAD_UNAVAILABLE','Recruitment uploads are awaiting the Citizen Google Drive connection. Please retry later or contact recruitment support. Your application information has not been submitted.',503);
 const accessToken=await refreshDriveToken();
 const parentReply=await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(await folder(person.scope))}?supportsAllDrives=true&fields=mimeType,trashed,capabilities(canAddChildren),permissions(type)`,{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(8000),cache:'no-store'});
 const parent=parentReply.ok?await parentReply.json() as {mimeType?:string;trashed?:boolean;capabilities?:{canAddChildren?:boolean};permissions?:{type:string}[]}:null;
 if(!parent||parent.trashed||parent.mimeType!=='application/vnd.google-apps.folder'||!parent.capabilities?.canAddChildren||!parent.permissions||parent.permissions.some(p=>['anyone','domain'].includes(p.type)))throw new ServiceIssue('DRIVE_FOLDER_REVIEW_REQUIRED','Recruitment storage needs a writable private Google Drive folder. An administrator must review its connection and access settings before you upload.',503);
 const boundary='citizen-'+randomUUID(),metadata={name:`${person.id}-${purpose}-${randomUUID()}-${name}`,parents:[await folder(person.scope)],appProperties:{citizen_owner:person.id,citizen_scope:person.scope,citizen_purpose:purpose}};
 const mime=purpose==='selfie'||purpose==='id_photo'?file.type:'application/pdf';
 const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,file,`\r\n--${boundary}--`]);
 const reply=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':`multipart/related; boundary=${boundary}`},body,signal:AbortSignal.timeout(25000)});
 if(!reply.ok)throw new ServiceIssue('DRIVE_UPLOAD_FAILED','Google Drive could not save this file. Keep the form open and retry the upload.',503);
 const saved=await reply.json() as {id?:string};
 if(!saved.id||!/^[\w-]+$/.test(saved.id))throw new ServiceIssue('DRIVE_UPLOAD_FAILED','Google Drive did not confirm a saved file. Retry the upload.',503);
 // Inherit the private recruitment folder permissions. Never create public-link permissions.
 return {fileId:saved.id,url:`https://drive.google.com/file/d/${saved.id}/view`};
}
