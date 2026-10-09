import 'server-only';
import {query,ServiceIssue} from './db';
import {can,type Person} from './contracts';
export type CorporateDirectoryRow={id:string;reference:string;title:string;kind:string;status:string;source_link:string;source_date:string|null;review_note:string;facts:Record<string,unknown>;display_name:string|null;email:string|null};
export type SubscriberRow={id:string;display_name:string;email:string;units:number;unit_price:string;currency:string;status:string;created_at:string;title:string};
export async function stakeholderDirectory(person:Person){
 if(!can(person.roles,['admin']))throw new ServiceIssue('ADMINISTRATION_ACCESS_DENIED','Only administrators can view the company-wide shareholder and subscriber directory.',403);
 const [corporate,subscriptions]=await Promise.all([
  query<CorporateDirectoryRow>(`SELECT r.id,r.reference,r.title,r.kind,r.status,r.source_link,r.source_date,r.review_note,r.facts,p.display_name,p.email FROM hub_corporate_records r LEFT JOIN hub_people p ON p.id=r.person_id AND p.scope=r.scope WHERE r.scope=$1 AND r.kind IN('holding','stakeholder') AND r.status<>'archived' ORDER BY r.kind,r.title`,[person.scope]),
  query<SubscriberRow>(`SELECT r.id,p.display_name,p.email,r.units,r.unit_price,r.currency,r.status,r.created_at,o.title FROM hub_subscription_requests r JOIN hub_people p ON p.id=r.person_id AND p.scope=r.scope JOIN hub_opportunities o ON o.id=r.opportunity_id AND o.scope=r.scope WHERE r.scope=$1 ORDER BY r.created_at DESC`,[person.scope])
 ]);
 return {holdings:corporate.filter(r=>r.kind==='holding'),dossiers:corporate.filter(r=>r.kind==='stakeholder'),subscriptions};
}
