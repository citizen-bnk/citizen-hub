export type HoldingSummary = {id:string;person_id:string|null;status:string;facts:Record<string,unknown>};
export function capitalSummary(records:HoldingSummary[]) {
 const active=records.filter(r=>r.status!=='archived');
 const confirmed=active.filter(r=>r.status==='confirmed'&&!/safe/i.test(String(r.facts.instrument||'')));
 const quantity=(r:HoldingSummary)=>Math.max(0,Number(r.facts.quantity)||0);
 return {active,confirmed,holders:new Set(active.filter(r=>r.person_id).map(r=>r.person_id)).size,
  unlinked:active.filter(r=>!r.person_id).length,reported:active.reduce((n,r)=>n+quantity(r),0),
  issued:confirmed.reduce((n,r)=>n+quantity(r),0),pending:active.filter(r=>r.status!=='confirmed').length};
}
export type PaymentSummary={currency:string;units:number;unit_price:string;recorded_receipts:string;status:string};
export function portfolioTotals(records:PaymentSummary[]) {
 const totals=new Map<string,{currency:string;committed:number;paid:number;outstanding:number}>();
 for(const r of records.filter(r=>!['withdrawn','declined'].includes(r.status))){
  const t=totals.get(r.currency)||{currency:r.currency,committed:0,paid:0,outstanding:0};
  const amount=Math.round(Number(r.unit_price)*100)*r.units,paid=Math.round(Number(r.recorded_receipts)*100);
  t.committed+=amount;t.paid+=paid;t.outstanding+=Math.max(0,amount-paid);totals.set(r.currency,t);
 }
 return [...totals.values()].map(t=>({...t,committed:t.committed/100,paid:t.paid/100,outstanding:t.outstanding/100}));
}
