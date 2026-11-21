import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {moduleAccess,requiredAccess} from '@/lib/access';
import {ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Recovery} from '@/components/Recovery';
import {OperationsView} from '@/components/OperationsView';
export const dynamic='force-dynamic';
export default async function Page(){const p=await currentPerson();if(!p)redirect('/login?next=/risk');if(!moduleAccess(p.roles,'risk'))return <WorkspaceShell person={p} active="risk"><Recovery code="WORKSPACE_ACCESS_DENIED" message={'This page requires '+requiredAccess('risk')+' access.'}/></WorkspaceShell>;try{const view=await OperationsView({person:p,kind:'risk'});return <WorkspaceShell person={p} active="risk">{view}</WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <WorkspaceShell person={p} active="risk"><Recovery code={e.code} message={e.message}/></WorkspaceShell>;throw e;}}
