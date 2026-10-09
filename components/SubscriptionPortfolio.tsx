import type {Person} from '@/lib/contracts';
import {subscriptionRecords} from '@/lib/investments';
import {money} from '@/lib/data';
import {SubscriptionReview} from './SubscriptionReview';
import {ServiceIssue} from '@/lib/db';
import {Recovery} from './Recovery';
export async function SubscriptionPortfolio({person,reviewQueue=false}:{person:Person;reviewQueue?:boolean}){
 let records;try{records=await subscriptionRecords(person,reviewQueue);}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}
 return <section id="subscriptions"><p>Subscriptions are private. Payment evidence is reviewed before your investment is confirmed; SAFE reference shares remain separate from issued holdings.</p>{records.length?<div className="readiness-items">{records.map(r=><article className="finding-row" key={r.id}><h3>{r.title}</h3>{reviewQueue&&<p>{r.display_name} · {r.email}</p>}<p>{r.units.toLocaleString()} reference shares · {money(Number(r.unit_price)*r.units,r.currency)}</p><span className="chip">{r.status==='submitted'?'Subscription saved — awaiting review':r.status.replaceAll('_',' ')}</span>{!['received','pending_conversion','declined','withdrawn'].includes(r.status)&&<p className="muted">{r.payment_link?'Payment evidence received — settlement review pending':'Payment evidence outstanding — investment unconfirmed'}</p>}{r.review_note&&<p>{r.review_note}</p>}<a className="button" href={'/subscriptions/'+r.id}>View subscription and payment</a>{reviewQueue&&<SubscriptionReview id={r.id} version={r.version} status={r.status} agreement={r.agreement_link} payment={r.payment_link}/>}</article>)}</div>:<p className="empty-state">No subscriptions yet. <a href="/opportunities">Subscribe for Shares</a>.</p>}</section>;
}
