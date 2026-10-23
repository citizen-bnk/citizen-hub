export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
/** Keep uploads below the deployed function request limit; never trust MIME alone. */
export function recruitmentFile(name:string,type:string,size:number,bytes:Uint8Array){
 if(size<1||size>MAX_UPLOAD_BYTES)throw new Error('Choose a non-empty PDF smaller than 3 MB.');
 if(!/\.pdf$/i.test(name)||type!=='application/pdf'||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('Upload a PDF document. Export your CV or references to PDF first.');
 return name.replace(/[^a-zA-Z0-9 ._-]/g,'_').slice(-150);
}
