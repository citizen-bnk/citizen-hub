import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {moduleAccess,requiredAccess} from '@/lib/access';
import {managesReadiness} from '@/lib/readiness-policy';
import {ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {ReadinessView,ReviewView} from '@/components/ReadinessView';
import {Recovery} from '@/components/Recovery';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await currentPerson();if(!p)redirect('/login?next=/licensing');if(!moduleAccess(p.roles,'licensing'))return <WorkspaceShell person={p} active="licensing"><Recovery code="WORKSPACE_ACCESS_DENIED" message={'This page requires '+requiredAccess('licensing')+' access.'}/></WorkspaceShell>;
try{const view=managesReadiness(p.roles)?await ReadinessView({person:p,filters:await searchParams}):await ReviewView({person:p,newFinding:false});return <WorkspaceShell person={p} active="licensing">{view}</WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <WorkspaceShell person={p} active="licensing"><Recovery code={e.code} message={e.message}/></WorkspaceShell>;throw e;}}
