import {z} from 'zod';

// These are reviewed source facts, not a live inventory or a certificate of title.
export const offerDisclosureSchema=z.object({
 issuer:z.string().trim().min(1).max(200),
 share_class:z.string().trim().min(1).max(100),
 subscription_type:z.literal('SAFE'),
 reviewed_on:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 register_as_of:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 register_unissued:z.number().int().nonnegative(),
 register_status:z.literal('pending_reconciliation')
}).strict();
export type OfferDisclosure=z.infer<typeof offerDisclosureSchema>;
export function readOfferDisclosure(value:unknown):OfferDisclosure|null{
 const parsed=offerDisclosureSchema.safeParse(value);
 return parsed.success?parsed.data:null;
}
export function validSubscriptionQuantity(units:number,min:number,max:number|null){
 return Number.isSafeInteger(units)&&units>=min&&units<=2147483647&&(max===null||units<=max);
}
