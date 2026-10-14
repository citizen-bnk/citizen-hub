import {z} from 'zod';
const note=z.string().trim().min(20).max(1500),id=z.string().uuid();
export const aiTaskCommand=z.discriminatedUnion('action',[
 z.object({action:z.enum(['approve_bonus','confirm_settlement']),subscription_id:id,note}).strict(),
 z.object({action:z.literal('record_payment'),subscription_id:id,amount:z.string().regex(/^\d{1,12}(\.\d{1,2})?$/).refine(x=>Number(x)>0),received_on:z.string().date(),reference:z.string().trim().min(3).max(200),note}).strict(),
 z.object({action:z.literal('prepare_documents'),subscription_id:id}).strict(),
 z.object({action:z.literal('amend_subscription'),subscription_id:id,units:z.number().int().positive().max(2147483647),bonus_units:z.number().int().nonnegative().max(2147483647),note}).strict(),
 z.object({action:z.literal('capture_subscription'),person_id:id,opportunity_id:id,units:z.number().int().positive().max(2147483647),bonus_units:z.number().int().nonnegative().max(2147483647),minimum_exception:z.string().trim().max(1500),note}).strict()
]);
export type AITaskCommand=z.infer<typeof aiTaskCommand>;
export const canExecuteAITasks=(roles:readonly string[])=>roles.includes('super_admin');
