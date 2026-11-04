import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {moduleAccess,requiredAccess} from '@/lib/access';
import {ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Recovery} from '@/components/Recovery';
import {OperationsView} from '@/components/OperationsView';
export const dynamic='force-dynamic';
export default async function Page(){const p=await currentPerson();if(!p)redirect('/login?next=/finance');if(!moduleAccess(p.roles,'finance'))return <WorkspaceShell person={p} active="finance"><Recovery code="WORKSPACE_ACCESS_DENIED" message={'This page requires '+requiredAccess('finance')+' access.'}/></WorkspaceShell>;try{const view=await OperationsView({person:p,kind:'finance'});return <WorkspaceShell person={p} active="finance">{view}</WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <WorkspaceShell person={p} active="finance"><Recovery code={e.code} message={e.message}/></WorkspaceShell>;throw e;}}
