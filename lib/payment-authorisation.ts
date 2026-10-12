import {z} from 'zod';
import {driveReference} from './contracts';
const link=z.string().max(1000).transform((value,ctx)=>{try{return driveReference(value).url;}catch{ctx.addIssue({code:'custom',message:'Use a Google Drive payment-evidence file link.'});return z.NEVER;}});
export const paymentAuthorisation=z.discriminatedUnion('basis',[
 z.object({basis:z.literal('settlement'),proof_link:link,confirmed:z.literal(true)}).strict(),
 z.object({basis:z.literal('deferred'),motivation:z.string().trim().min(20).max(2000),due_date:z.string().date(),confirmed:z.literal(true)}).strict()
]);
export function signingPaymentReady(row:{payment_authorisation_basis:string|null;payment_authorised_by:string|null;payment_authorised_at:string|null;payment_link:string|null;deferred_payment_motivation:string|null;deferred_payment_due:string|null}){return !!row.payment_authorised_by&&!!row.payment_authorised_at&&(row.payment_authorisation_basis==='settlement'&&!!row.payment_link||row.payment_authorisation_basis==='deferred'&&!!row.deferred_payment_motivation&&!!row.deferred_payment_due);}
