import {redirect} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {moduleAccess,requiredAccess} from '@/lib/access';
import {managesReadiness} from '@/lib/readiness-policy';
import {ServiceIssue} from '@/lib/db';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {ReadinessView,ReviewView} from '@/components/ReadinessView';
import {Recovery} from '@/components/Recovery';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await currentPerson();if(!p)redirect('/login?next=/review');if(!moduleAccess(p.roles,'review'))return <WorkspaceShell person={p} active="review"><Recovery code="WORKSPACE_ACCESS_DENIED" message={'This page requires '+requiredAccess('review')+' access.'}/></WorkspaceShell>;
try{const view=await ReviewView({person:p,newFinding:(await searchParams).new==='1'});return <WorkspaceShell person={p} active="review">{view}</WorkspaceShell>;}catch(e){if(e instanceof ServiceIssue)return <WorkspaceShell person={p} active="review"><Recovery code={e.code} message={e.message}/></WorkspaceShell>;throw e;}}
