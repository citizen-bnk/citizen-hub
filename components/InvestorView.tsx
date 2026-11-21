import {query} from '@/lib/db';
import {Panel,Hero} from './BoardView';
import {type Overview} from '@/lib/data';
import {investmentMoney as money} from '@/lib/investment-display';
import {type Person,can} from '@/lib/contracts';
import {subscriptionRecords} from '@/lib/investments';
import {portfolioTotals,capitalSummary,type HoldingSummary} from '@/lib/capital-summary';
import {statusLabels,type SubscriptionStatus} from '@/lib/subscription-lifecycle';

export async function InvestorView({person,data}:{person:Person;data:Overview}){
 const [subscriptions,holdings,updates]=await Promise.all([
  subscriptionRecords(person),
  query<HoldingSummary>("SELECT id,person_id,status,facts FROM hub_corporate_records WHERE person_id=$1 AND scope=$2 AND kind='holding' AND status<>'archived'",[person.id,person.scope]),
  query<{id:string;title:string;summary:string;status:string}>("SELECT id,title,summary,status FROM hub_projects WHERE scope=$1 AND published AND allowed_roles && $2::text[] ORDER BY updated_at DESC LIMIT 4",[person.scope,person.roles])
 ]);
 const active=subscriptions.filter(s=>!['withdrawn','declined'].includes(s.status));
 const totals=portfolioTotals(active),capital=capitalSummary(holdings);
 const documents=data.documents.filter(d=>['safe','certificate','certificate_preview','invoice','receipt','bonus_agreement'].includes(d.category));
 const admin=can(person.roles,['admin']),board=person.roles.includes('board_member'),boardInvestment=data.investments[0];
 return <div className="classic-investor">
  <Hero title="My Investment Portfolio" subtitle={`Welcome back, ${person.display_name.split(' ')[0]}`} kind="investor"/>
  <div className="classic-investor-actions">
   <a className="button primary" href="/opportunities">Subscribe to Shares</a>
   <a className="button" href="/subscriptions?mine=1">View My Subscriptions</a>
  </div>
  <section className="classic-news"><h2>Latest News &amp; Achievements</h2><p>Company progress and announcements</p><div>{updates.map(update=><a href="/projects" key={update.id}><strong>{update.title}</strong><span>{update.summary}</span><small>{update.status.replaceAll('_',' ')}</small></a>)}{!updates.length&&<p>New company updates will appear here when published.</p>}</div></section>
  <div className="classic-investor-summary">
   <Panel title="Share subscriptions">
    {active.length?<><div className="classic-investor-numbers"><div><span>SAFE subscriptions</span><strong>{active.length}</strong></div><div><span>Reference units</span><strong>{active.reduce((sum,s)=>sum+s.units,0).toLocaleString()}</strong></div></div>
     {totals.map(total=><div className="classic-investor-money" key={total.currency}><div><span>Subscribed</span><strong>{money(total.committed,total.currency)}</strong></div><div><span>Paid</span><strong>{money(total.paid,total.currency)}</strong></div><div><span>Outstanding</span><strong>{money(total.outstanding,total.currency)}</strong></div></div>)}
     <div className="classic-investor-recent">{active.slice(0,3).map(s=><a href={'/subscriptions/'+s.id} key={s.id}><span><strong>{s.certificate_reference||s.title}</strong><small>{s.units.toLocaleString()} SAFE reference units · {statusLabels[s.status as SubscriptionStatus]||s.status}</small></span><span>View →</span></a>)}</div>
     <a className="button" href="/subscriptions?mine=1">View all subscriptions</a></>:
     <div className="classic-investor-empty"><strong>No subscriptions yet</strong><p>Explore the available offer and start a subscription.</p><a className="button primary" href="/opportunities">Subscribe to Shares</a></div>}
   </Panel>
   {board&&<Panel title="Board Investment">{boardInvestment?<><p>{boardInvestment.instrument}</p><div className="classic-investor-numbers"><div><span>Amount invested</span><strong>{money(boardInvestment.amount,boardInvestment.currency)}</strong></div><div><span>Status</span><strong>{boardInvestment.status.replaceAll('_',' ')}</strong></div></div></>:<p>No active board investment is recorded.</p>}<a className="button" href="/holdings">View investment details</a></Panel>}
   {!board&&<Panel title="My shareholdings">
    <div className="classic-investor-numbers"><div><span>Confirmed issued shares</span><strong>{capital.issued.toLocaleString()}</strong></div><div><span>Pending reconciliation</span><strong>{capital.pending}</strong></div></div>
    <p className="muted">SAFE reference units become issued shares only after an approved conversion.</p>
    <a className="button" href="/holdings">View my holdings</a>
   </Panel>}
  </div>
  <div className="classic-investor-bottom">
   <Panel title="Investor data room"><p>Review company materials and investment evidence.</p><a className="button" href="/dataroom">Open data room</a></Panel>
   <Panel title="Investment documents"><p>{documents.length} document{documents.length===1?'':'s'} available to your account.</p><a className="button" href="/document-centre">View documents</a></Panel>
   {board&&<Panel title="My shareholdings"><div className="classic-investor-numbers"><div><span>Confirmed issued shares</span><strong>{capital.issued.toLocaleString()}</strong></div><div><span>Pending reconciliation</span><strong>{capital.pending}</strong></div></div><a className="button" href="/holdings">View holdings</a></Panel>}
  </div>
  {admin&&<Panel title="Investor administration"><div className="classic-investor-actions"><a className="button primary" href="/subscriptions/new">Add investor or subscribe on behalf</a><a className="button" href="/subscriptions">Review subscriptions</a><a className="button" href="/cap-table">Manage cap table</a></div></Panel>}
 </div>;
}
