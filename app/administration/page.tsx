import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {stakeholderDirectory,type CorporateDirectoryRow} from '@/lib/stakeholders';
import {ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero,Panel,Empty} from '@/components/BoardView';
import {Recovery} from '@/components/Recovery';
import {subscriptionAmount} from '@/lib/subscription-money';
import {statusLabels,type SubscriptionStatus} from '@/lib/subscription-lifecycle';
export const dynamic='force-dynamic';
function text(value:unknown){return typeof value==='string'||typeof value==='number'?String(value):'';}
function RecordCard({row}:{row:CorporateDirectoryRow}){
 const name=text(row.facts.holder)||text(row.facts.name)||row.display_name||row.title;
 const email=row.email||text(row.facts.email);
 return <article className="stakeholder-card"><h3>{name}</h3><p className="muted">Source record: {row.reference}</p>{email?<p><a href={'mailto:'+email}>{email}</a></p>:<p className="muted">Individual email not yet verified or linked.</p>}
  {row.kind==='holding'&&<><p>{Number(row.facts.quantity).toLocaleString('en-ZA')} reported shares · {text(row.facts.instrument)}</p><p>{text(row.facts.basis)}</p></>}
  {row.kind==='stakeholder'&&<><p>{text(row.facts.relationship)}</p><p className="muted">{text(row.facts.contact_status)}</p>{text(row.facts.interim_contact_email)&&<p>Interim communication address: {text(row.facts.interim_contact_email)}. This does not authorise access to another investor’s account.</p>}{text(row.facts.authorised_representative)&&<p>Authorised representative: {text(row.facts.authorised_representative)}</p>}</>}
  <span className="chip">{row.status==='confirmed'?'Confirmed corporate record':row.status==='conflict'?'Discrepancy — review required':'Pending reconciliation'}</span>
  <details><summary>Evidence and reconciliation notes</summary><p>{row.review_note||'Administrator reconciliation is still required.'}</p>{text(row.facts.reconciliation)&&<p>{text(row.facts.reconciliation)}</p>}{row.source_date&&<p>Source date: {String(row.source_date).slice(0,10)}</p>}<a className="button" href={row.source_link} target="_blank" rel="noopener noreferrer">Open source in Google Drive ↗</a></details>
 </article>;
}
export default async function Administration({searchParams}:{searchParams:Promise<{q?:string;section?:string}>}){
 try{
  const person=await currentPerson();if(!person)redirect('/login?next=/administration');
  if(!can(person.roles,['admin']))return <WorkspaceShell person={person} active="administration"><Recovery title="Administrator access required" message="This directory contains private corporate records. Return to your own investment portfolio." code="ADMINISTRATION_ACCESS_DENIED"/></WorkspaceShell>;
  const search=await searchParams,q=(search.q||'').trim().slice(0,200),section=['shareholders','subscribers','dossiers'].includes(search.section||'')?search.section!:'shareholders';
  const data=await stakeholderDirectory(person),match=(values:unknown[])=>values.some(value=>text(value).toLowerCase().includes(q.toLowerCase()));
  const holdings=data.holdings.filter(r=>match([r.title,r.reference,r.facts.holder,r.display_name,r.email]));
  const dossiers=data.dossiers.filter(r=>match([r.title,r.reference,r.facts.name,r.display_name,r.email,r.facts.email]));
  const subscriptions=data.subscriptions.filter(r=>match([r.display_name,r.email,r.id,r.title]));
  return <WorkspaceShell person={person} active="administration"><Hero title="Shareholders & Subscribers" subtitle="Administration" kind="investor" description="Source-backed corporate holdings, historical investor dossiers and new subscriptions. SAFE subscriptions remain separate from share ownership."/>
   <div className="subscription-summary"><span><strong>{data.holdings.length}</strong>shareholder records</span><span><strong>{data.subscriptions.length}</strong>platform subscriptions</span><span><strong>{data.dossiers.length}</strong>investor / subscriber dossiers</span></div>
   <Panel title="Company directory"><form className="subscription-filters"><label>Show<select name="section" defaultValue={section}><option value="shareholders">Shareholders</option><option value="subscribers">Platform subscribers</option><option value="dossiers">Existing investors & subscribers</option></select></label><label>Search<input name="q" defaultValue={q} placeholder="Name, email or reference" maxLength={200}/></label><button className="button" type="submit">Apply</button><a className="button" href="/administration">Clear</a><a className="button" href="/subscriptions">Review subscriptions</a></form>
    {section==='shareholders'&&<><p className="muted">The September working baseline is not a certified register. Reported quantities do not confirm payment, title or conversion. Review discrepancies against the linked evidence.</p><div className="stakeholder-grid">{holdings.map(row=><RecordCard key={row.id} row={row}/>)}</div>{!holdings.length&&<Empty>No shareholder records match this search in the current environment.</Empty>}</>}
    {section==='dossiers'&&<><p className="muted">Includes existing subscriber dossiers and prospective investors. A dossier, profile or contact address does not establish a paid subscription or shareholding. These entries may also appear in other sections.</p><div className="stakeholder-grid">{dossiers.map(row=><RecordCard key={row.id} row={row}/>)}</div>{!dossiers.length&&<Empty>No investor or subscriber dossiers match this search.</Empty>}</>}
    {section==='subscribers'&&<><p className="muted">Subscriptions created through this platform. Earlier SAFE instruments are listed under Existing investors & subscribers; they have not been invented as new transactions.</p><div className="stakeholder-grid">{subscriptions.map(row=><article className="stakeholder-card" key={row.id}><h3>{row.display_name}</h3><p>{row.email}</p><p>{row.title}</p><p>{row.units.toLocaleString()} reference shares · {row.currency} {subscriptionAmount(row.units,row.unit_price)}</p><span className="chip">{statusLabels[row.status as SubscriptionStatus]||row.status}</span><p>{row.created_at.slice(0,10)}</p><a className="button" href={'/subscriptions/'+row.id}>Open subscription and payment review</a></article>)}</div>{!subscriptions.length&&<Empty>No platform subscriptions match this search.</Empty>}</>}
   </Panel>
  </WorkspaceShell>;
 }catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;throw e;}
}
