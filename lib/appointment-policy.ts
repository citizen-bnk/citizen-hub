import {z} from 'zod';
import {driveReference} from './contracts';
const link=z.string().trim().max(2000).transform((v,ctx)=>{try{return driveReference(v).url;}catch{ctx.addIssue({code:'custom',message:'Use the Google Drive link for the appointment evidence.'});return z.NEVER;}});
export const appointmentInput=z.discriminatedUnion('action',[
 z.object({action:z.literal('save'),id:z.string().uuid().optional(),version:z.number().int().positive().optional(),title:z.string().trim().min(3).max(200),nominee_source:z.string().regex(/^(person|corporate|application|form):[0-9a-f-]{36}$/i,'Select an existing investor, subscriber or applicant.'),phase:z.enum(['pre_licensing','post_licensing','both']),source_link:link,review_note:z.string().trim().min(5).max(3000),start_date:z.union([z.string().date(),z.literal('')]),status:z.enum(['work_in_progress','conflict','archived'])}).strict(),
 z.object({action:z.literal('confirm'),id:z.string().uuid(),version:z.number().int().positive(),approval_link:link,regulatory_link:link,review_note:z.string().trim().min(5).max(3000),confirmed:z.literal(true)}).strict()
]);
export function independentApprover(editor:string|null,approver:string){return !!editor&&editor!==approver;}
