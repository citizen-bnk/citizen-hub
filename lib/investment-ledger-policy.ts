import {z} from 'zod';
export const amountInput=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/,'Enter an amount with at most two decimal places.');
export function cents(value:string){const [whole,fraction='']=amountInput.parse(value).split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));}
export function decimal(value:bigint){return `${value/100n}.${(value%100n).toString().padStart(2,'0')}`;}
export function investmentBalance(units:number,price:string,received:string,bonus:number){const total=BigInt(units)*cents(price),paid=cents(received);if(paid>total)throw Error('Payment exceeds the subscription amount.');return {total:decimal(total),received:decimal(paid),outstanding:decimal(total-paid),bonusEligible:paid===total&&total>0n?bonus:0};}
const note=z.string().trim().min(20,'Explain the transaction or correction (at least 20 characters).').max(2000);
export const ledgerInput=z.discriminatedUnion('action',[
 z.object({action:z.literal('amend'),id:z.string().uuid(),version:z.number().int().positive(),units:z.number().int().positive().max(2147483647),bonus_units:z.number().int().nonnegative().max(2147483647),note,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('reconcile_form'),id:z.string().uuid(),version:z.number().int().positive(),form_id:z.string().uuid(),form_version:z.number().int().positive(),note,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('capture'),request_key:z.string().uuid(),person_id:z.string().uuid(),opportunity_id:z.string().uuid(),offer_version:z.number().int().positive(),units:z.number().int().positive().max(2147483647),bonus_units:z.number().int().nonnegative().max(2147483647),bonus_offering_kind:z.enum(['company','person']).default('company'),bonus_offering_person_id:z.string().uuid().nullable().default(null),bonus_source_record_id:z.string().uuid().nullable().default(null),note,minimum_exception:z.string().trim().max(2000),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('payment'),id:z.string().uuid(),version:z.number().int().positive(),request_key:z.string().uuid(),amount:amountInput.refine(v=>cents(v)>0n,'Enter a positive payment.'),received_on:z.string().date(),reference:z.string().trim().min(3).max(200),note,proof_link:z.string().max(1000),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('void_payment'),id:z.string().uuid(),version:z.number().int().positive(),payment_id:z.string().uuid(),note,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('approve_bonus'),id:z.string().uuid(),version:z.number().int().positive(),note,confirmed:z.literal(true)}).strict()
]);
