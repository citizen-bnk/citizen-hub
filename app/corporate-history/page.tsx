import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {can} from '@/lib/contracts';
import {query,ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Panel,Hero} from '@/components/BoardView';
import {Recovery} from '@/components/Recovery';
import {z} from 'zod';
export const dynamic='force-dynamic';
export default async function History({searchParams}:{searchParams:Promise<{id?:string}>}){const p=await currentPerson();if(!p)redirect('/login?next=/administration');if(!can(p.roles,['admin']))return <Recovery code="ADMINISTRATION_ACCESS_DENIED" message="Only administrators can review corporate history."/>;try{const id=z.string().uuid().parse((await searchParams).id);const rows=await query<{version:number;created_at:string;display_name:string;snapshot:Record<string,unknown>}>(`SELECT h.version,h.created_at,p.display_name,h.snapshot FROM hub_corporate_history h JOIN hub_corporate_records r ON r.id=h.record_id JOIN hub_people p ON p.id=h.actor_id WHERE r.id=$1 AND r.scope=$2 ORDER BY h.version DESC`,[id,p.scope]);return <WorkspaceShell person={p} active="administration"><Hero title="Corporate record history" subtitle="Versioned corrections and independent approvals."/><a href="/administration" className="button">Back to administration</a><Panel title="Recorded changes">{rows.map(r=><details key={r.version}><summary>Version {r.version} · {r.display_name} · {new Date(r.created_at).toLocaleString('en-ZA')}</summary><pre className="record-snapshot">{JSON.stringify(r.snapshot,null,2)}</pre></details>)}{!rows.length&&<p>No amendments have been recorded yet.</p>}</Panel></WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <Recovery code={e.code} message={e.message}/>;return <Recovery code="RECORD_UNAVAILABLE" message="Select a valid record from Administration."/>;}}
