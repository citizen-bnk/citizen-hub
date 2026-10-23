import {z} from 'zod';
import {driveReference,can} from './contracts';
export const operates=(roles:readonly string[])=>can(roles,['admin','back_office']);
export const closesRecord=(roles:readonly string[],editor:string,actor:string)=>can(roles,['admin'])&&editor!==actor;
const source=z.string().trim().max(1000).transform((v,c)=>{if(!v)return '';try{return driveReference(v).url;}catch{c.addIssue({code:'custom',message:'Use a Google Drive file link for evidence.'});return z.NEVER;}});
const money=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/,'Enter a non-negative amount, for example 12500.00');
const facts=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('risk'),category:z.enum(['operational','governance','compliance','technology','financial']),likelihood:z.number().int().min(1).max(5),impact:z.number().int().min(1).max(5),mitigation:z.string().trim().min(5).max(2000),review_date:z.string().date()}),
 z.object({kind:z.literal('finance'),currency:z.enum(['LSL','ZAR','USD']),period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),planned:money,actual:money,category:z.string().trim().min(3).max(100)})]);
export const operationInput=z.discriminatedUnion('action',[
 z.object({action:z.literal('save'),id:z.string().uuid().optional(),version:z.number().int().positive().optional(),title:z.string().trim().min(3).max(200),summary:z.string().trim().min(10).max(3000),facts,owner_id:z.string().uuid(),evidence_link:source,status:z.enum(['draft','active','review'])}).strict(),
 z.object({action:z.literal('close'),id:z.string().uuid(),version:z.number().int().positive(),confirmed:z.literal(true)}).strict()]);
