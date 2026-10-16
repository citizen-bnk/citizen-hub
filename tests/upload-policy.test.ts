import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAX_UPLOAD_BYTES,recruitmentFile} from '../lib/upload-policy';
const pdf=new TextEncoder().encode('%PDF-1.7\n');
test('Recruitment accepts only bounded PDF files, not renamed executables or other formats',()=>{
 assert.equal(recruitmentFile('CV.pdf','application/pdf',pdf.length,pdf),'CV.pdf');
 for(const [name,type,size,bytes] of [['CV.pdf','application/pdf',5,new Uint8Array([77,90,0,0,0])],['CV.exe','application/pdf',9,pdf],['CV.pdf','text/html',9,pdf],['CV.pdf','application/pdf',0,pdf],['CV.pdf','application/pdf',MAX_UPLOAD_BYTES+1,pdf]] as const)assert.throws(()=>recruitmentFile(name,type,size,bytes));
 assert.equal(recruitmentFile('../../CV.pdf','application/pdf',9,pdf),'.._.._CV.pdf');
});
