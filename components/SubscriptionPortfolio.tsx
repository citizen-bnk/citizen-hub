import {InvestmentCardGrid} from './InvestmentCardGrid';
import {OverlayAction,RecordActions} from './RecordUI';
import {subscriptionRecords} from '@/lib/investments';
import {type Person} from '@/lib/contracts';
import {investmentMoney as money,paymentState} from '@/lib/investment-display';
import {SubscriptionPayment} from './SubscriptionPayment';
import {SubscriptionReview} from './SubscriptionReview';
import {statusLabels,type SubscriptionStatus,paidStatus} from '@/lib/subscription-lifecycle';

export async function SubscriptionPortfolio({person,reviewQueue=false,status='all'}:{person:Person;reviewQueue?:boolean;status?:string}){
 const records=await subscriptionRecords(person,reviewQueue);
 const visible=records.filter(r=>status==='all'||(status==='paid'?paidStatus(r.status):status==='incomplete'?!['received','pending_conversion','declined','withdrawn'].includes(r.status):r.status===status));
 return <section id="subscriptions" className="classic-subscriptions">
  <InvestmentCardGrid entries={visible.map(r=>({text:[r.display_name,r.title,r.certificate_reference,r.email].join(' '),amount:Number(r.unit_price)*r.units,currency:r.currency,payment:paymentState(Number(r.unit_price)*r.units,Number(r.recorded_receipts),r.status)}))}>
   {visible.map(r=>{
    const total=Math.round(Number(r.unit_price)*100)*r.units/100,received=Number(r.recorded_receipts),remaining=Math.max(0,total-received);
    const inactive=['declined','withdrawn'].includes(r.status),reference=r.certificate_reference||'Reference pending';
    return <article className="classic-subscription-row" key={r.id}>
     <div className="classic-subscription-main">
      <span className="classic-subscription-icon" aria-hidden>▣</span>
      <div><strong>{reference}</strong><span>{r.title}{reviewQueue?' · '+r.display_name:''}</span><small>{r.units.toLocaleString()} SAFE reference units · {money(r.unit_price,r.currency)} each</small></div>
     </div>
     <div className="classic-subscription-amount"><strong>{money(total,r.currency)}</strong><small>{money(received,r.currency)} paid</small></div>
     <div className="classic-subscription-status"><span className="chip">{statusLabels[r.status as SubscriptionStatus]||r.status}</span>{remaining>0&&!inactive&&<small>{money(remaining,r.currency)} outstanding</small>}</div>
     <div className="classic-subscription-actions">
      <a className="button" href={'/subscriptions/'+r.id}>View details</a>
      {remaining>0&&!inactive&&(reviewQueue?<a className="button primary" href={'/subscriptions/'+r.id+'#record-payment'}>Record payment</a>:<OverlayAction label="Pay now / upload proof" primary><SubscriptionPayment id={r.id} amount={money(remaining,r.currency)}/></OverlayAction>)}
      <RecordActions name={reference} actions={[
       {label:'Documents and agreement',href:'/subscriptions/'+r.id+'#subscription-documents'},
       {label:'Top up investment',href:reviewQueue?'/subscriptions/new?person='+r.person_id:'/opportunities'},
       ...(reviewQueue?[{label:'Review subscription',content:<SubscriptionReview id={r.id} version={r.version} status={r.status} agreement={r.agreement_link} payment={r.payment_link} invoice={r.invoice_link} receipt={r.receipt_link} certificate={r.certificate_preview_link}/>}]:[])
      ]}/>
     </div>
    </article>;
   })}
  </InvestmentCardGrid>
  {!visible.length&&<div className="classic-investor-empty"><strong>No matching subscriptions</strong><p>Clear the filters or explore the available share offer.</p><a className="button primary" href="/opportunities">Subscribe to Shares</a></div>}
  <p className="muted">SAFE reference units are separate from confirmed issued shares.</p>
 </section>;
}
