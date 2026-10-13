import {RecordList} from '@/components/RecordUI';
import {recordMetadata} from '@/lib/record-list';
import { query } from '@/lib/db';
import type { Person } from '@/lib/contracts';
import { Panel, Empty } from './BoardView';
export async function OwnHoldings({ person }: {
    person: Person;
}) { const rows = await query<{
    id: string;
    title: string;
    status: string;
    facts: {
        quantity?: number;
        instrument?: string;
    };
    source_link: string;
}>("SELECT id,title,status,facts,source_link FROM hub_corporate_records WHERE person_id=$1 AND scope=$2 AND kind='holding' AND status<>'archived' ORDER BY title", [person.id, person.scope]); return <Panel title="My register records" className="span-2"><RecordList label="Records" records={rows.map(r => ({ ...recordMetadata(r), content: <article key={r.id} className="finding-row"><h3>{r.title}</h3><p>{r.facts.instrument || 'Shareholding'}</p><p>{Number(r.facts.quantity || 0).toLocaleString('en-ZA')} reported shares · {r.status === 'confirmed' ? 'Independently reconciled' : 'Pending reconciliation'}</p><a className="button" href={r.source_link} target="_blank" rel="noopener noreferrer">Source evidence ↗</a></article> }))}/>{!rows.length && <Empty>No register entry has been linked to your account yet. Your SAFE subscriptions remain in your subscription portfolio.</Empty>}</Panel>; }
