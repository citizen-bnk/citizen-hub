import {ReconciliationStatus} from '@/components/ReconciliationStatus';
import {RecordControls} from '@/components/RecordUI';
import { RecordList } from '@/components/RecordUI';
import { recordMetadata } from '@/lib/record-list';
import { OverlayAction, RecordActions } from '@/components/RecordUI';
import { FormSubscriptionSync } from '@/components/FormSubscriptionSync';
import type { FormSubmission } from '@/lib/form-subscriptions';
import { redirect } from 'next/navigation';
import { currentPerson } from '@/lib/session';
import { can } from '@/lib/contracts';
import { stakeholderDirectory, type CorporateDirectoryRow } from '@/lib/stakeholders';
import { CorporateEditor, type PersonOption } from '@/components/CorporateEditor';
import { query, ServiceIssue } from '@/lib/db';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Hero, Panel, Empty } from '@/components/BoardView';
import { Recovery } from '@/components/Recovery';
import { subscriptionAmount } from '@/lib/subscription-money';
import { statusLabels, type SubscriptionStatus } from '@/lib/subscription-lifecycle';
export const dynamic = 'force-dynamic';
function text(value: unknown) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function RecordCard({ row, people, actor, superAdmin }: {
    row: CorporateDirectoryRow;
    people: PersonOption[];
    actor: string;
    superAdmin?: boolean;
}) {
    const name = text(row.facts.holder) || text(row.facts.name) || row.display_name || row.title;
    const email = row.email || text(row.facts.email);
    return <article className="stakeholder-card"><h3>{name}</h3>{row.person_id&&<a className="button" href={'/subscriptions/new?person='+row.person_id}>Subscribe on behalf</a>}<p className="muted">Source record: {row.reference}</p>{email ? <p><a href={'mailto:' + email}>{email}</a></p> : <p className="muted">Individual email not yet verified or linked.</p>}
  {row.kind === 'holding' && <><p>{Number(row.facts.quantity).toLocaleString('en-ZA')} reported shares · {text(row.facts.instrument)}</p><p>{text(row.facts.basis)}</p></>}
  {row.kind === 'stakeholder' && <><p>{text(row.facts.relationship)}</p><p className="muted">{text(row.facts.contact_status)}</p>{text(row.facts.interim_contact_email) && <p>Interim communication address: {text(row.facts.interim_contact_email)}. This does not authorise access to another investor’s account.</p>}{text(row.facts.authorised_representative) && <p>Authorised representative: {text(row.facts.authorised_representative)}</p>}</>}
  <ReconciliationStatus id={row.id} status={row.status} roles={superAdmin?['super_admin']:[]}/>
  <RecordControls><RecordActions name="this record" actions={[{ label: "Evidence and reconciliation notes", content: <><p>{row.review_note || 'Administrator reconciliation is still required.'}</p>{text(row.facts.reconciliation) && <p>{text(row.facts.reconciliation)}</p>}{row.source_date && <p>Source date: {String(row.source_date).slice(0, 10)}</p>}<a className="button" href={row.source_link} target="_blank" rel="noopener noreferrer">Open source in Google Drive ↗</a></> }, { label: "Edit investor / shareholder record", content: <><CorporateEditor record={row} people={people} actor={actor}/></> }]}/><a className="button" href={'/corporate-history?id=' + row.id}>Change history</a></RecordControls>
 </article>;
}
export default async function Administration({ searchParams }: {
    searchParams: Promise<{
        q?: string;
        section?: string;
        new?: string;
    }>;
}) {
    try {
        const person = await currentPerson();
        if (!person)
            redirect('/login?next=/administration');
        if (!can(person.roles, ['admin']))
            return <WorkspaceShell person={person} active="administration"><Recovery title="Administrator access required" message="This directory contains private corporate records. Return to your own investment portfolio." code="ADMINISTRATION_ACCESS_DENIED"/></WorkspaceShell>;
        const search = await searchParams, q = (search.q || '').trim().slice(0, 200), section = ['shareholders', 'subscribers', 'dossiers', 'google-forms'].includes(search.section || '') ? search.section! : 'shareholders';
        const [data, people, formRows] = await Promise.all([stakeholderDirectory(person), query<PersonOption>('SELECT id,display_name,email FROM hub_people WHERE scope=$1 AND active ORDER BY display_name', [person.scope]), query<FormSubmission>('SELECT * FROM hub_form_submissions WHERE scope=$1 ORDER BY sheet_row DESC', [person.scope])]), match = (values: unknown[]) => values.some(value => text(value).toLowerCase().includes(q.toLowerCase()));
        const holdings = data.holdings.filter(r => match([r.title, r.reference, r.facts.holder, r.display_name, r.email]));
        const dossiers = data.dossiers.filter(r => match([r.title, r.reference, r.facts.name, r.display_name, r.email, r.facts.email]));
        const subscriptions = data.subscriptions.filter(r => match([r.display_name, r.email, r.id, r.title]));
        return <WorkspaceShell person={person} active="administration"><div className="actions"><OverlayAction primary label="Add investor"><CorporateEditor kind="stakeholder" people={people} actor={person.id}/></OverlayAction><OverlayAction label="Add holding"><CorporateEditor kind="holding" people={people} actor={person.id}/></OverlayAction><a className="button" href="/document-centre">Documents & signing</a><a className="button" href="/messages">Messages & groups</a><a className="button" href="/projects">Projects & milestones</a><a className="button" href="/cards">Card recovery</a><a className="button" href="/users">User profiles & recovery</a></div><Hero title="Shareholders & Subscribers" subtitle="Administration" kind="investor" description="Source-backed corporate holdings, historical investor dossiers and new subscriptions. SAFE subscriptions remain separate from share ownership."/>
   <div className="subscription-summary"><a href="/administration?section=shareholders"><strong>{data.holdings.length}</strong>shareholder records</a><a href="/administration?section=subscribers"><strong>{data.subscriptions.length}</strong>platform subscriptions</a><a href="/administration?section=dossiers"><strong>{data.dossiers.length}</strong>investor / subscriber dossiers</a></div>
   {['holding', 'stakeholder'].includes(search.new || '') && <Panel title={search.new === 'holding' ? 'New cap-table entry' : 'New investor'}><CorporateEditor kind={search.new as 'holding' | 'stakeholder'} people={people} actor={person.id}/></Panel>}
   <Panel title="Working cap table"><p className="muted">Reported and independently confirmed holdings remain separate. SAFE reference shares are excluded from issued ownership.</p><div className="table-scroll"><table><thead><tr><th>Holder</th><th>Class</th><th>Reported shares</th><th>Working %</th><th>Register status</th></tr></thead><tbody>{data.holdings.filter(r => r.status !== 'archived').map(r => { const quantity = Number(r.facts.quantity), total = data.holdings.filter(h => h.status !== 'archived').reduce((n, h) => n + (Number.isFinite(Number(h.facts.quantity)) ? Number(h.facts.quantity) : 0), 0); return <tr key={r.id}><td>{text(r.facts.holder) || r.title}</td><td>{text(r.facts.instrument)}</td><td>{Number.isFinite(quantity) ? quantity.toLocaleString('en-ZA') : 'Needs correction'}</td><td>{total && Number.isFinite(quantity) ? (quantity / total * 100).toFixed(2) + '%' : '—'}</td><td>{r.status === 'confirmed' ? 'Independently confirmed' : 'Pending reconciliation'}</td></tr>; })}</tbody></table></div></Panel>
   <Panel title="Company directory"><form className="subscription-filters"><label>Show<select name="section" defaultValue={section}><option value="shareholders">Shareholders</option><option value="subscribers">Platform subscribers</option><option value="dossiers">Existing investors & subscribers</option><option value="google-forms">Google Form subscribers</option></select></label><label>Search<input name="q" defaultValue={q} placeholder="Name, email or reference" maxLength={200}/></label><button className="button" type="submit">Apply</button><a className="button" href="/administration">Clear</a><a className="button" href="/subscriptions">Review subscriptions</a></form>
    {section === 'shareholders' && <><p className="muted">The September working baseline is not a certified register. Reported quantities do not confirm payment, title or conversion. Review discrepancies against the linked evidence.</p><div className="stakeholder-grid"><RecordList label="Investors & shareholders" records={holdings.map(row => ({ ...recordMetadata(row), content: <RecordCard key={row.id} row={row} people={people} actor={person.id} superAdmin={person.roles.includes('super_admin')}/> }))}/></div>{!holdings.length && <Empty>No shareholder records match this search in the current environment.</Empty>}</>}
    {section === 'dossiers' && <><p className="muted">Includes existing subscriber dossiers and prospective investors. A dossier, profile or contact address does not establish a paid subscription or shareholding. These entries may also appear in other sections.</p><div className="stakeholder-grid"><RecordList label="Investors & shareholders" records={dossiers.map(row => ({ ...recordMetadata(row), content: <RecordCard key={row.id} row={row} people={people} actor={person.id} superAdmin={person.roles.includes('super_admin')}/> }))}/></div>{!dossiers.length && <Empty>No investor or subscriber dossiers match this search.</Empty>}</>}
    {section === 'subscribers' && <><p className="muted">Subscriptions created through this platform. Earlier SAFE instruments are listed under Existing investors & subscribers; they have not been invented as new transactions.</p><div className="stakeholder-grid"><RecordList label="Investors & shareholders" records={subscriptions.map(row => ({ ...recordMetadata(row), content: <article className="stakeholder-card" key={row.id}><h3>{row.display_name}</h3><p>{row.email}</p><p>{row.title}</p><p>{row.units.toLocaleString()} reference shares · {row.currency} {subscriptionAmount(row.units, row.unit_price)}</p><span className="chip">{statusLabels[row.status as SubscriptionStatus] || row.status}</span><p>{row.created_at.slice(0, 10)}</p><RecordControls><a className="button" href={'/subscriptions/' + row.id}>Open subscription and payment review</a></RecordControls></article> }))}/></div>{!subscriptions.length && <Empty>No platform subscriptions match this search.</Empty>}</>}
    {section === 'google-forms' && <><p className="muted">Source-reported subscriptions. Historical prices are retained; payment, signature validity and share issuance require reconciliation.</p>{person.scope === 'live' && <FormSubscriptionSync />}<div className="stakeholder-grid">{formRows.filter(r => match([r.facts.name, r.facts.email, r.facts.company_name])).map(r => <article className="stakeholder-card" key={r.id}><h3>{r.facts.name || r.facts.company_name || 'Contact needs review'}</h3><p>{r.facts.email}</p><p>{r.facts.quantity} reference shares · reported price {r.facts.price}</p><p>Reported amount: {r.facts.amount}</p><span className="chip">{r.review_status.replaceAll('_', ' ')}</span><p>Submitted {r.source_timestamp}</p><RecordControls><a className="button" href={r.source_link + '#gid=1549690171&range=A' + r.sheet_row} target="_blank" rel="noopener noreferrer">Review source response ↗</a><a className="button" href={'/administration?section=dossiers&q=' + encodeURIComponent(r.facts.name)}>Find existing investor record</a></RecordControls></article>)}</div>{!formRows.length && <Empty>No Google Form responses have been imported into this environment.</Empty>}</>}
   </Panel>
  </WorkspaceShell>;
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
}
