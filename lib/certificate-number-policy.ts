import {z} from 'zod';
export const certificateNumberInput=z.object({subscription_id:z.string().uuid(),base_reference:z.string().trim().toUpperCase().regex(/^CB[1-9][0-9]{0,8}$/, 'Use the original number, for example CB36.'),topup:z.boolean(),note:z.string().trim().min(10).max(2000),confirmed:z.literal(true)}).strict();
