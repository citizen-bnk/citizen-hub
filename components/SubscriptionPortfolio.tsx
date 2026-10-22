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
    return <article className="classic-subscription-card" key={r.id}>
     <header><div><strong>{reference}</strong><p>{r.title}{reviewQueue?' · '+r.display_name:''}</p></div><RecordActions name={reference} actions={[{label:'Documents and agreement',href:'/subscriptions/'+r.id+'#subscription-documents'},{label:'Top up investment',href:reviewQueue?'/subscriptions/new?person='+r.person_id:'/opportunities'},...(reviewQueue?[{label:'Review subscription',content:<SubscriptionReview id={r.id} version={r.version} status={r.status} agreement={r.agreement_link} payment={r.payment_link} invoice={r.invoice_link} receipt={r.receipt_link} certificate={r.certificate_preview_link}/>}]:[])]}/></header>
     <div className="classic-subscription-badges"><span className="chip">SAFE</span><span className="chip">{statusLabels[r.status as SubscriptionStatus]||r.status}</span></div>
     <dl><div><dt>SAFE reference units</dt><dd>{r.units.toLocaleString()}</dd></div><div><dt>Price per unit</dt><dd>{money(r.unit_price,r.currency)}</dd></div><div><dt>Total amount</dt><dd>{money(total,r.currency)}</dd></div><div><dt>Amount paid</dt><dd>{money(received,r.currency)}</dd></div><div><dt>Remaining</dt><dd>{money(remaining,r.currency)}</dd></div></dl>
     <div className="classic-subscription-actions">
      <OverlayAction label="Quick view"><h3>{reference} · {r.title}</h3><p>{r.units.toLocaleString()} SAFE reference units</p><p>{money(total,r.currency)} subscribed · {money(received,r.currency)} paid · {money(remaining,r.currency)} outstanding</p><div className="classic-investor-actions">{r.agreement_link&&<a className="button" href={r.agreement_link} target="_blank" rel="noopener noreferrer">SAFE note ↗</a>}{r.invoice_link&&<a className="button" href={r.invoice_link} target="_blank" rel="noopener noreferrer">Invoice ↗</a>}{r.receipt_link&&<a className="button" href={r.receipt_link} target="_blank" rel="noopener noreferrer">Receipt ↗</a>}<a className="button primary" href={'/subscriptions/'+r.id}>Open full record</a></div></OverlayAction>
      <a className="button" href={'/subscriptions/'+r.id}>View details &amp; pay</a>
      {remaining>0&&!inactive&&(reviewQueue?<a className="button primary" href={'/subscriptions/'+r.id+'#record-payment'}>Record payment</a>:<OverlayAction label="Pay now / upload proof" primary><SubscriptionPayment id={r.id} amount={money(remaining,r.currency)}/></OverlayAction>)}
     </div>
    </article>;
   })}
  </InvestmentCardGrid>
  {!visible.length&&<div className="classic-investor-empty"><span className="classic-empty-icon" aria-hidden>✦</span><strong>{records.length?'No matching subscriptions':'Start Your Investment Journey'}</strong><p>{records.length?'Clear the filters to see your subscriptions.':'You do not have a share subscription yet. Explore the available offer and begin when you are ready.'}</p><div className="classic-investor-actions"><a className="button primary" href="/opportunities">Subscribe to Shares</a><a className="button" href="/investors">Learn more</a></div></div>}
  <p className="muted">SAFE reference units are separate from confirmed issued shares.</p>
 </section>;
}
