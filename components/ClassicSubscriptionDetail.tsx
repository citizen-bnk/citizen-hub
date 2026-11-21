import {OverlayAction} from './RecordUI';
import {SubscriptionDocuments} from './SubscriptionDocuments';
import {SubscriptionLedger} from './SubscriptionLedger';
import {SubscriptionAuthorisation} from './SubscriptionAuthorisation';
import {SubscriptionPayment} from './SubscriptionPayment';
import {SubscriptionTimeline} from './SubscriptionTimeline';
import {WithdrawSubscription} from './WithdrawSubscription';
import {SubscriptionReview} from './SubscriptionReview';
import {Panel,Hero} from './BoardView';
import {type Person,can} from '@/lib/contracts';
import {investmentMoney as money} from '@/lib/investment-display';
import {withdrawalAllowed,statusLabels,type SubscriptionStatus} from '@/lib/subscription-lifecycle';

type DetailRecord={id:string;display_name:string;email:string;title:string;instrument:string;units:number;unit_price:string;currency:string;person_id:string;status:string;version:number;super_admin_approved_at:string|null;digital_accepted_at:string|null;created_at:string;reviewed_at:string|null;review_note:string|null;agreement_link:string|null;payment_link:string|null;invoice_link:string|null;receipt_link:string|null;certificate_preview_link:string|null;payment_authorisation_basis:string|null;deferred_payment_motivation:string|null;deferred_payment_due:string|null};

export function ClassicSubscriptionDetail({person,record,reference,amount}:{person:Person;record:DetailRecord;reference:string;amount:string}){
 const mine=record.person_id===person.id,admin=can(person.roles,['admin']),paid=['received','pending_conversion'].includes(record.status);
 return <div className="classic-investor classic-record">
  <Hero title={reference==='Not assigned yet'?'Investment details':reference} subtitle={record.title} kind="investor"/>
  <div className="classic-investor-actions"><a className="button" href={mine?'/subscriptions?mine=1':'/subscriptions'}>← My investments</a><a className="button" href="/opportunities">Subscribe again</a></div>
  <div id="subscription-summary" className="classic-subscription-stats"><div><span>Reference units</span><strong>{record.units.toLocaleString()}</strong></div><div><span>Unit price</span><strong>{money(record.unit_price,record.currency)}</strong></div><div><span>Subscription total</span><strong>{money(amount,record.currency)}</strong></div><div><span>Status</span><strong>{statusLabels[record.status as SubscriptionStatus]||record.status}</strong></div></div>
  <div className="classic-investor-summary"><Panel title="Subscription"><p><strong>{record.display_name}</strong> · {record.email}</p><p>{record.instrument} · {reference}</p>{record.review_note&&<p>{record.review_note}</p>}<SubscriptionTimeline record={record} superAdmin={person.roles.includes('super_admin')}/>{mine&&withdrawalAllowed(record)&&<WithdrawSubscription id={record.id} version={record.version}/>}</Panel>
   <Panel title="Payment" ><div id="record-payment"/><p>{paid?'Payment confirmed':'Payment pending administrator confirmation'}</p>{mine&&!paid&&!['declined','withdrawn'].includes(record.status)&&<SubscriptionPayment id={record.id} amount={money(amount,record.currency)}/>}<SubscriptionLedger person={person} id={record.id}/></Panel></div>
  <div id="subscription-documents"/><SubscriptionDocuments id={record.id}/>
  <Panel title="Documents and evidence"><div className="classic-investor-actions">{record.agreement_link&&<a className="button" href={record.agreement_link} target="_blank" rel="noopener noreferrer">SAFE agreement ↗</a>}{record.invoice_link&&<a className="button" href={record.invoice_link} target="_blank" rel="noopener noreferrer">Invoice ↗</a>}{record.receipt_link&&<a className="button" href={record.receipt_link} target="_blank" rel="noopener noreferrer">Receipt ↗</a>}{record.certificate_preview_link&&<a className="button" href={record.certificate_preview_link} target="_blank" rel="noopener noreferrer">Certificate preview ↗</a>}{record.payment_link&&<a className="button" href={record.payment_link} target="_blank" rel="noopener noreferrer">Payment evidence ↗</a>}</div><div className="classic-investor-actions"><OverlayAction label="Certificate status"><p>SAFE conversion pending. This is an unsigned preview, not an issued share certificate.</p><p>{reference} · {record.units.toLocaleString()} reference units</p></OverlayAction><OverlayAction label="Invoice status"><p>{record.invoice_link?'Your invoice is linked above.':'Prepare the document pack to file the invoice.'}</p></OverlayAction><OverlayAction label="Receipt status"><p>{record.receipt_link?'Your receipt is linked above.':'A receipt appears after the payment is confirmed and the document pack is prepared.'}</p></OverlayAction></div>{record.payment_authorisation_basis==='deferred'&&<p>Payment deferral: {record.deferred_payment_motivation} · due {record.deferred_payment_due?.slice(0,10)}</p>}</Panel>
  {admin&&<Panel title="Administrator review"><div id="confirm-subscription"/><SubscriptionAuthorisation id={record.id} version={record.version} payment={record.payment_link} basis={record.payment_authorisation_basis}/><SubscriptionReview id={record.id} version={record.version} status={record.status} agreement={record.agreement_link} payment={record.payment_link} invoice={record.invoice_link} receipt={record.receipt_link} certificate={record.certificate_preview_link}/></Panel>}
 </div>;
}
