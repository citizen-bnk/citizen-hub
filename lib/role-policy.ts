import {z} from 'zod';
export const roleNames=['customer','investor','shareholder','board_member','staff','back_office','admin','super_admin','candidate'] as const;
export const roleChange=z.object({roles:z.array(z.enum(roleNames)).min(1).max(9).transform(r=>[...new Set(r)]),version:z.number().int().positive(),reason:z.string().trim().min(8).max(500),confirmed:z.literal(true)}).strict();
export function verifiedOwner(identity:{primary_email:string;primary_email_verified?:boolean},scope:string){return scope==='live'&&identity.primary_email_verified===true&&identity.primary_email.trim().toLowerCase()==='phafanep@gmail.com';}
