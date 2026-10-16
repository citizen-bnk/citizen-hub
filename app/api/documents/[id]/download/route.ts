import {requirePerson} from '@/lib/session';
import {documentFor} from '@/lib/document-centre';
import {driveToken,readDrive} from '@/lib/institutional-drive';
import {failure} from '@/lib/http';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{const p=await requirePerson(),d=await documentFor(p,(await params).id),file=await readDrive(await driveToken(p.scope),d.signed_file_id||d.drive_file_id,p.scope);return new Response(Buffer.from(file.bytes),{headers:{'Content-Type':file.info.mimeType==='application/vnd.google-apps.document'?'application/pdf':file.info.mimeType,'Content-Disposition':'attachment; filename="'+d.name.replace(/[^a-zA-Z0-9._ -]/g,'_')+'.'+(file.info.mimeType.startsWith('image/')?file.info.mimeType.split('/')[1]:'pdf')+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return failure(e);}}
