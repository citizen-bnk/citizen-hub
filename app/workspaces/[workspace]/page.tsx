import {redirect,notFound} from 'next/navigation';
import {currentPerson} from '@/lib/session';
import {workspaces,workspaceCards} from '@/lib/workspaces';
import {WorkspaceShell} from '@/components/WorkspaceShell';
import {Hero} from '@/components/BoardView';
import {Recovery} from '@/components/Recovery';
import {workspaceCount} from '@/lib/workspace-counts';
export const dynamic='force-dynamic';
export default async function Workspace({params}:{params:Promise<{workspace:string}>}){const {workspace}=await params,w=workspaces.find(w=>w.id===workspace);if(!w)notFound();const person=await currentPerson();if(!person)redirect('/login?next='+encodeURIComponent('/workspaces/'+workspace));const cards=workspaceCards(workspace,person.roles);if(!cards.length)return <WorkspaceShell person={person} active={workspace}><Recovery code="WORKSPACE_ACCESS_DENIED" message="Your assigned roles do not include this workspace. Return Home or ask an administrator to review access."/></WorkspaceShell>;const counted=await Promise.all(cards.map(async card=>({...card,count:await workspaceCount(card.path,person)})));return <WorkspaceShell person={person} active={workspace}><Hero title={w.label} subtitle="Your workspace"/><div className="workspace-card-grid">{counted.map(card=><a key={card.path} className="workspace-action-card" href={card.path}><>{card.count!==null&&<strong className="dashboard-count">{card.count}</strong>}</><h2>{card.label}<span aria-hidden>↗</span></h2>{card.description&&<p>{card.description}</p>}{card.comingSoon&&<span className="chip">Coming soon</span>}</a>)}</div></WorkspaceShell>;}

