import {z} from 'zod';
export const subscriptionInput=z.object({request_key:z.string().uuid(),opportunity_id:z.string().uuid(),version:z.number().int().positive(),units:z.number().int().positive().max(2147483647),source_of_funds:z.string().trim().min(3).max(2000),purpose:z.string().trim().min(3).max(2000),consent:z.literal(true)}).strict();
export {subscriptionAmount} from './subscription-money';
