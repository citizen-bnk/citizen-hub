import {z} from 'zod';
export const newInvestorInput=z.object({request_key:z.string().uuid(),display_name:z.string().trim().min(3).max(200),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),phone:z.string().trim().max(50).default(''),identity_reference:z.string().trim().max(100).default(''),address:z.string().trim().max(500).default('')}).strict();
