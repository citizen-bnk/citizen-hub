import {PDFDocument,StandardFonts,rgb,degrees} from 'pdf-lib';
export type SignatureLayout=Record<string,{page:number;x:number;y:number;width:number;height:number}>;
export async function certificateLayout(source:Uint8Array):Promise<SignatureLayout>{const pdf=await PDFDocument.load(source),pages=pdf.getPages(),layout:SignatureLayout={};for(const [capacity,key] of [['chairperson','chairman_signature'],['company_secretary','secretary_signature']]){const widget=pdf.getForm().getTextField(key).acroField.getWidgets()[0];if(!widget)throw Error('Certificate signature field has no position.');const page=pages.findIndex(p=>p.ref===widget.P());if(page<0)throw Error('Certificate signature field has no page.');const rect=widget.getRectangle();layout[capacity]={page,...rect,height:rect.height||55};}return layout;}
export async function certificatePDF(source:Uint8Array,values:{name:string;quantity:string;reference:string;date:string},preview:boolean){
 const pdf=await PDFDocument.load(source),form=pdf.getForm();for(const key of ['investor_name','certificate_number','number_of_shares','date_issued','secretary_signature','chairman_signature','cert_no_footer']){try{form.getTextField(key);}catch{throw Error('The approved certificate template has changed. Review its form fields.');}}
 for(const [key,value] of Object.entries({investor_name:values.name,certificate_number:values.reference,number_of_shares:values.quantity,date_issued:preview?'':values.date,secretary_signature:'',chairman_signature:'',cert_no_footer:values.reference}))form.getTextField(key).setText(value);
 form.flatten();if(preview){const font=await pdf.embedFont(StandardFonts.HelveticaBold);for(const page of pdf.getPages()){const {width,height}=page.getSize();page.drawText('SAFE NOTE CONVERSION PENDING',{x:35,y:40,size:Math.min(14,width/45),font,color:rgb(.45,.1,.45)});page.drawText('UNSIGNED PREVIEW - NOT ISSUED',{x:55,y:height*.68,size:Math.min(22,width/35),font,color:rgb(.55,.2,.5),opacity:.45,rotate:degrees(12)});}}return new Uint8Array(await pdf.save());
}
export async function appendSignatures(source:Uint8Array,originalDigest:string,parties:{name:string;capacity:string;authorised_at:string;signature:Uint8Array}[],layout:SignatureLayout={}){
 const pdf=await PDFDocument.load(source),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);let page=pdf.addPage([595,842]),y=780;page.drawText('Citizen - Signature authorisations',{x:40,y,size:18,font:bold});y-=32;page.drawText('Original document SHA-256',{x:40,y,size:10,font});y-=18;page.drawText(originalDigest,{x:40,y,size:8,font});y-=45;
 for(const p of parties){if(y<170){page=pdf.addPage([595,842]);y=780;}const signature=await pdf.embedPng(p.signature),box=signature.scaleToFit(220,65),slot=layout[p.capacity];if(slot){const target=pdf.getPages()[slot.page];if(!target||slot.width<=0||slot.height<=0||slot.x<0||slot.y<0||slot.x+slot.width>target.getWidth()||slot.y+slot.height>target.getHeight())throw Error('Invalid certificate signature layout.');const positioned=signature.scaleToFit(slot.width,slot.height);target.drawImage(signature,{x:slot.x,y:slot.y,width:positioned.width,height:positioned.height});}page.drawText(p.name,{x:40,y,size:12,font:bold});y-=18;page.drawText(p.capacity+' | '+p.authorised_at,{x:40,y,size:10,font});y-=78;page.drawImage(signature,{x:40,y,width:box.width,height:box.height});y-=32;}
 return new Uint8Array(await pdf.save());
}

export async function markDemonstration(source:Uint8Array){
 const pdf=await PDFDocument.load(source),font=await pdf.embedFont(StandardFonts.HelveticaBold);
 for(const page of pdf.getPages()){const {width,height}=page.getSize();page.drawText('DEMONSTRATION - NO LEGAL OR FINANCIAL EFFECT',{x:22,y:height/2,size:Math.min(22,width/29),font,color:rgb(.55,.2,.5),opacity:.4,rotate:degrees(12)});}
 return new Uint8Array(await pdf.save());
}

export async function paymentArrangementPDF(source:Uint8Array,motivation:string,due:string){
 const pdf=await PDFDocument.load(source),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);let page=pdf.addPage([595,842]),y=750;
 page.drawText('SAFE - payment arrangement for review',{x:40,y,size:17,font:bold});y-=40;
 for(const paragraph of ['Administrator-approved payment deferral. The signing parties must review and agree these arrangements before execution.','Payment due: '+due.slice(0,10),'Motivation: '+motivation]){let line='';for(const word of paragraph.split(/\s+/)){const candidate=line?line+' '+word:word;if(font.widthOfTextAtSize(candidate,11)>510&&line){page.drawText(line,{x:40,y,size:11,font});y-=18;line=word;if(y<60){page=pdf.addPage([595,842]);y=780;}}else line=candidate;}if(line){page.drawText(line,{x:40,y,size:11,font});y-=32;}}
 return new Uint8Array(await pdf.save());
}
