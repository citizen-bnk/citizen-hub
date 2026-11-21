import {OverlayAction} from '@/components/RecordUI';
import { moduleAccess } from '@/lib/access';
import { redirect } from 'next/navigation';
import { currentPerson } from '@/lib/session';
import { can } from '@/lib/contracts';
import { query, ServiceIssue } from '@/lib/db';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Panel, Hero, Empty } from '@/components/BoardView';
import { Recovery } from '@/components/Recovery';
import { accessibleDocuments } from '@/lib/document-centre';
import { emailReady } from '@/lib/messaging';
import type { PersonOption } from '@/components/CorporateEditor';
import { MessageComposer, RecipientGroup, MessageDelivery, NewsletterPreference } from '@/components/MessageForms';
export const dynamic = 'force-dynamic';
export default async function Messages() {
    const p = await currentPerson();
    if (!p)
        redirect('/login?next=/messages');
    const admin = can(p.roles, ['admin']);
    try {
        const [messages, recipients, people, groups, docs, preference] = await Promise.all([
            query<{
                id: string;
                subject: string;
                body: string;
                kind: string;
                status: string;
                version: number;
                shared_link: string | null;
            }>(`SELECT m.*,m.document_link AS shared_link FROM hub_messages m LEFT JOIN hub_documents d ON d.id=m.document_id AND d.scope=m.scope WHERE m.scope=$1 AND ($2::boolean OR (m.status='published' AND EXISTS(SELECT 1 FROM hub_message_recipients r WHERE r.message_id=m.id AND r.person_id=$3))) ORDER BY m.created_at DESC LIMIT 100`, [p.scope, admin, p.id]),
            admin ? query<{
                message_id: string;
                display_name: string;
                email: string;
                email_status: string;
                last_error: string | null;
            }>(`SELECT r.*,p.display_name FROM hub_message_recipients r JOIN hub_people p ON p.id=r.person_id AND p.scope=r.scope WHERE r.scope=$1`, [p.scope]) : [],
            admin ? query<PersonOption>('SELECT id,display_name,email FROM hub_people WHERE scope=$1 AND active ORDER BY display_name', [p.scope]) : [],
            admin ? query<{
                id: string;
                name: string;
                version: number;
                members: string[];
            }>(`SELECT g.*,ARRAY(SELECT person_id::text FROM hub_group_members m WHERE m.group_id=g.id) AS members FROM hub_recipient_groups g WHERE scope=$1 ORDER BY name`, [p.scope]) : [],
            admin ? accessibleDocuments(p) : [], query<{
                preferences: {
                    investor_newsletters?: boolean;
                };
            }>('SELECT preferences FROM hub_people WHERE id=$1 AND scope=$2', [p.id, p.scope])
        ]);
        return <WorkspaceShell person={p} active="communications"><Hero title="Messages & investor updates" subtitle="Private communication, with reviewed recipients."/><div className="actions"><a className="button" href="/document-centre">Documents & signing</a>{moduleAccess(p.roles, 'projects') && <a className="button" href="/projects">Business progress</a>}</div><Panel title="My newsletter preference"><NewsletterPreference enabled={preference[0]?.preferences?.investor_newsletters === true}/></Panel>{admin && <><Panel title="Compose"><OverlayAction label="New message or newsletter"><MessageComposer people={people} groups={groups} docs={docs}/></OverlayAction></Panel><Panel title="Recipient groups"><OverlayAction label="New group"><RecipientGroup people={people}/></OverlayAction>{groups.map(g => <details key={g.id}><summary>{g.name} · {g.members.length} people</summary><RecipientGroup people={people} group={g}/></details>)}</Panel></>}<Panel title={admin ? 'Drafts and published messages' : 'Messages shared with me'}>{messages.map(m => <article className="stakeholder-card" key={m.id}><h3>{m.subject}</h3><span className="chip">{m.kind} · {m.status}</span><p className="application-statement">{m.body}</p>{m.shared_link && <a className="button" href={m.shared_link} target="_blank" rel="noopener noreferrer">Shared document ↗</a>}{admin && <><OverlayAction label="Review recipients & delivery">{recipients.filter(r => r.message_id === m.id).map((r, i) => <p key={i}>{r.display_name} · {r.email} · {r.email_status}{r.last_error && ' · ' + r.last_error}</p>)}</OverlayAction><MessageDelivery id={m.id} version={m.version} status={m.status} ready={emailReady() && p.scope === 'live' && process.env.VERCEL_ENV === 'production'}/></>}</article>)}{!messages.length && <Empty>No messages have been published to your account yet.</Empty>}</Panel></WorkspaceShell>;
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
}
