import {RecordControls} from '@/components/RecordUI';
import {RecordList} from '@/components/RecordUI';
import {recordMetadata} from '@/lib/record-list';
import { OverlayAction } from '@/components/RecordUI';
import { redirect } from 'next/navigation';
import { currentPerson } from '@/lib/session';
import { can } from '@/lib/contracts';
import { query, ServiceIssue } from '@/lib/db';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Panel, Hero, Empty } from '@/components/BoardView';
import { Recovery } from '@/components/Recovery';
import { accessibleDocuments, signingRequests } from '@/lib/document-centre';
import { institutionalDriveReady } from '@/lib/institutional-drive';
import { DocumentRegister, DocumentGenerator, DocumentSharing, SignatureRequestForm, SigningAction, SignatureSetup, TemplateApproval, DocumentUpload } from '@/components/DocumentCentreForms';
import type { PersonOption } from '@/components/CorporateEditor';
export const dynamic = 'force-dynamic';
export default async function Centre() {
    const p = await currentPerson();
    if (!p)
        redirect('/login?next=/document-centre');
    const admin = can(p.roles, ['admin']);
    try {
        const [docs, signatures, people, groups, holdings, subscriptions, templates] = await Promise.all([accessibleDocuments(p), signingRequests(p), admin ? query<PersonOption>('SELECT id,display_name,email FROM hub_people WHERE scope=$1 AND active ORDER BY display_name', [p.scope]) : [], admin ? query<{
                id: string;
                name: string;
            }>('SELECT id,name FROM hub_recipient_groups WHERE scope=$1 ORDER BY name', [p.scope]) : [], admin ? query<{
                id: string;
                title: string;
            }>("SELECT id,title FROM hub_corporate_records WHERE kind='holding' AND scope=$1 AND status<>'archived' ORDER BY title", [p.scope]) : [], admin ? query<{
                id: string;
                display_name: string;
                title: string;
            }>(`SELECT s.id,p.display_name,o.title FROM hub_subscription_requests s JOIN hub_people p ON p.id=s.person_id JOIN hub_opportunities o ON o.id=s.opportunity_id WHERE s.scope=$1 AND s.status NOT IN('withdrawn','declined') AND s.unit_price=10 AND s.currency='ZAR' AND s.units>=1000 AND s.agreement_link IS NULL`, [p.scope]) : [], admin ? query<{
                id: string;
                name: string;
                shared_link: string;
                version: number;
                approved_at: string | null;
            }>('SELECT * FROM hub_document_templates WHERE scope=$1 ORDER BY kind', [p.scope]) : []]);
        return <WorkspaceShell person={p} active="documents"><Hero title="Documents & signing" subtitle="Private documents. Explicit authorisation."/><div className="actions"><a className="button" href="/messages">Messages & groups</a>{admin && <a className="button" href="/administration">Investor administration</a>}<a className="button" href="#my-signature">My signature</a></div>{admin && <Panel title="Prepare documents"><OverlayAction label="Prepare investment documents"><DocumentGenerator holdings={holdings} subscriptions={subscriptions}/></OverlayAction><OverlayAction label="Upload a private PDF"><DocumentUpload /></OverlayAction><OverlayAction label="Add an existing Drive document"><DocumentRegister people={people}/></OverlayAction><OverlayAction label="Approved templates"><DocumentUpload templates/>{templates.map(t => <article className="finding-row" key={t.id}><h3>{t.name}</h3><a className="button" href={t.shared_link} target="_blank" rel="noopener noreferrer">Review source ↗</a><p>{t.approved_at ? 'Approved on ' + new Date(t.approved_at).toLocaleDateString('en-ZA') : 'Review required before generation'}</p><TemplateApproval id={t.id} version={t.version}/></article>)}</OverlayAction></Panel>}<Panel title="Signing requests"><RecordList label="Records" records={signatures.map(r => ({ ...recordMetadata(r), content: <article className="stakeholder-card" key={r.id}><h3>{r.name}</h3><span className="chip">{r.status}</span>{r.failure_code && <p className="inline-error">{r.failure_code} — filing needs attention.</p>}<SigningAction request={r} personId={p.id} name={p.display_name} admin={admin}/></article> }))}/>{!signatures.length && <Empty>No documents currently require your signature.</Empty>}</Panel><Panel title="Your document library"><div className="stakeholder-grid"><RecordList label="Records" records={docs.map(d => ({ ...recordMetadata(d), content: <article className="stakeholder-card" key={d.id}><h3>{d.name}</h3><p>{d.document_reference&&<>{d.document_reference} · Revision {d.revision} · </>}{d.category.replaceAll('_', ' ')} · {d.state.startsWith('draft:') ? 'Unsigned draft' : d.state}</p><RecordControls><a className="button" href={d.signed_link || d.shared_link} target="_blank" rel="noopener noreferrer">Open document ↗</a>{admin && <><OverlayAction label="Share privately"><DocumentSharing doc={d} people={people} groups={groups}/></OverlayAction><OverlayAction label="Request signatures"><SignatureRequestForm doc={d} people={people}/></OverlayAction><a className="button" href="/ai">Prepare new draft revision</a></>}</RecordControls></article> }))}/></div>{!docs.length && <Empty>No documents have been shared with this account yet.</Empty>}</Panel><section id="my-signature"><Panel title="My saved signature"><SignatureSetup available={await institutionalDriveReady(p.scope)}/></Panel></section></WorkspaceShell>;
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
}
