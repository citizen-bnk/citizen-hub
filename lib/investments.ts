import 'server-only';
import {query} from './db';
import {readOfferDisclosure,type OfferDisclosure} from './offer-disclosure';
import {can,type Person} from './contracts';
export type Opportunity={id:string;title:string;summary:string;instrument:string;unit_price:string;currency:string;min_units:number;max_units:number|null;disclosure:OfferDisclosure|null;terms_link:string|null;version:number;scope:string};
export type SubscriptionRequest={id:string;title:string;display_name?:string;email?:string;units:number;unit_price:string;currency:string;status:string;created_at:string;version:number;review_note:string|null;agreement_link:string|null;payment_link:string|null;invoice_link:string|null;receipt_link:string|null;certificate_preview_link:string|null};
export async function opportunities(person:Person|null){
 const scope=person?.scope||'live';
 const offers=await
 query<Opportunity>("SELECT * FROM hub_opportunities WHERE scope=$1 AND status='open' AND (closes_at IS NULL OR closes_at>now()) AND (scope='demonstration' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND terms_link IS NOT NULL)) ORDER BY title",[scope]);return {offers:offers.filter(offer=>readOfferDisclosure(offer.disclosure)!==null)};
}
export async function subscriptionRecords(person:Person,reviewQueue=false){
 return query<SubscriptionRequest>(`SELECT r.*,o.title,p.display_name,p.email FROM hub_subscription_requests r JOIN hub_opportunities o ON o.id=r.opportunity_id JOIN hub_people p ON p.id=r.person_id WHERE r.scope=$1 AND ($2::boolean OR r.person_id=$3) ORDER BY r.created_at DESC`,[person.scope,reviewQueue&&can(person.roles,['admin']),person.id]);
}
