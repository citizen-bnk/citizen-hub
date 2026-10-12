import 'server-only';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {driveJSON,readDrive,saveDrive} from './institutional-drive';
import {ServiceIssue} from './db';
import type {Scope} from './contracts';
function docText(v:unknown):string{if(!v||typeof v!=='object')return '';const o=v as {textRun?:{content?:string}};if(o.textRun)return o.textRun.content||'';return Object.values(v).map(docText).join('');}
export async function safeDraft(token:string,scope:Scope,source:{bytes:Uint8Array;info:{mimeType:string}},values:{name:string;email:string;address:string;identity:string;reference:string;amount:string;units:string;date:string},operation:string){
 const native=await saveDrive(token,scope,'SAFE preparation '+values.reference,source.bytes,source.info.mimeType,operation+':native',true);
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const current=await fetch(`https://docs.googleapis.com/v1/documents/${native.id}`,{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});if(!current.ok)throw new ServiceIssue('SAFE_TEMPLATE_CONVERSION_FAILED','The SAFE template could not be prepared as a Google Doc. Review the Drive and Docs connection.',503);const doc=await current.json(),text=docText(doc.body);if(!text.includes('R10.00')||/R5\.00/.test(text))throw new ServiceIssue('SAFE_TEMPLATE_PRICE_MISMATCH','This template does not match approved new-subscription pricing. Review it before generating a contract.',422);
 const replacements:Record<string,string>={
 'CB-[___]':values.reference,'Name: [_________________________________]':'Name: '+values.name,'Investor: [_________________________________]':'Investor: '+values.name,
 'Investor ID/Passport: [_________________________]':'Investor ID/Passport: '+values.identity,'ID/Passport Number: [_________________________]':'ID/Passport Number: '+values.identity,
 'Email: [_________________________________]':'Email: '+values.email,'Address: [_________________________________]':'Address: '+values.address,
 'Issue Date: [___________], 2026':'Issue Date: '+values.date,'Date of Investment: [___________], 2026':'Date of Investment: '+values.date,
 'R [_____________]':'R '+values.amount,'[_____________] shares':values.units+' reference shares','[_____________] CB':values.reference,
 '[Investor Name] CB':values.reference,'[Investor email]':values.email,'[Investor address]':values.address,
 };
 const required=['CB-[___]','[_________________________________]','R [_____________]','[_____________] shares','[Investor email]','[Investor address]'];if(required.some(field=>!text.includes(field)))throw new ServiceIssue('SAFE_TEMPLATE_FIELDS_CHANGED','The SAFE template fields changed. Review its personalisation map before preparing a draft.',422);
 const requests=Object.entries(replacements).map(([find,replaceText])=>({replaceAllText:{containsText:{text:find,matchCase:true},replaceText}}));
 const update=await fetch(`https://docs.googleapis.com/v1/documents/${native.id}:batchUpdate`,{method:'POST',headers,body:JSON.stringify({writeControl:{requiredRevisionId:doc.revisionId},requests}),signal:AbortSignal.timeout(20000)});if(!update.ok)throw new ServiceIssue('SAFE_PERSONALISATION_FAILED','The SAFE draft changed or could not be personalised. Retry this operation.',503);
 const exported=await readDrive(token,native.id),pdf=await PDFDocument.load(exported.bytes),font=await pdf.embedFont(StandardFonts.HelveticaBold);for(const page of pdf.getPages())page.drawText('DRAFT COPY - SEE SIGNATURE AUTHORISATIONS IF APPENDED',{x:35,y:18,size:10,font,color:rgb(.55,.2,.5)});
 return new Uint8Array(await pdf.save());
}
