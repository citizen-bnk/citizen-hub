import {RecordList} from '@/components/RecordUI';
import {recordMetadata} from '@/lib/record-list';
import { OverlayAction } from '@/components/RecordUI';
import { moduleAccess, requiredAccess } from '@/lib/access';
import { redirect } from 'next/navigation';
import { currentPerson } from '@/lib/session';
import { can } from '@/lib/contracts';
import { query, ServiceIssue } from '@/lib/db';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Panel, Hero, Empty } from '@/components/BoardView';
import { Recovery } from '@/components/Recovery';
import { ProjectForm, MilestoneForm, type ProjectRecord, type MilestoneRecord } from '@/components/ProjectForms';
export const dynamic = 'force-dynamic';
export default async function Projects() {
    const p = await currentPerson();
    if (!p)
        redirect('/login?next=/projects');
    if (!moduleAccess(p.roles, 'projects'))
        return <WorkspaceShell person={p} active="projects"><Recovery title="Access not available" code="WORKSPACE_ACCESS_DENIED" message={'This page requires ' + requiredAccess('projects') + ' access. Ask an administrator to review your roles.'}/></WorkspaceShell>;
    const admin = can(p.roles, ['admin']);
    try {
        const projects = await query<ProjectRecord>('SELECT * FROM hub_projects WHERE scope=$1 AND ($2::boolean OR (published AND allowed_roles && $3::text[])) ORDER BY updated_at DESC', [p.scope, admin, p.roles]);
        const milestones = await query<MilestoneRecord>('SELECT m.* FROM hub_milestones m JOIN hub_projects p ON p.id=m.project_id AND p.scope=m.scope WHERE m.scope=$1 AND ($2::boolean OR (p.published AND p.allowed_roles && $3::text[])) ORDER BY target_date NULLS LAST', [p.scope, admin, p.roles]);
        return <WorkspaceShell person={p} active="projects"><Hero title="Projects & milestones" subtitle="Progress you can follow." description="Dated business updates and supporting evidence."/>{admin && <Panel title="New project"><OverlayAction label="Create a project"><ProjectForm /></OverlayAction></Panel>}<RecordList label="Records" records={projects.map(project => ({ ...recordMetadata(project), content: <Panel key={project.id} title={project.title}><span className="chip">{project.status.replaceAll('_', ' ')}</span><p className="application-statement">{project.summary}</p>{project.source_link && <a className="button" href={project.source_link} target="_blank" rel="noopener noreferrer">Supporting documents ↗</a>}<div className="activity-list">{milestones.filter(m => m.project_id === project.id).map(m => <article className="finding-row" key={m.id}><h3>{m.title}</h3><p>{m.status.replaceAll('_', ' ')} · {m.target_date ? new Date(m.target_date).toLocaleDateString('en-ZA') : 'Target date not set'}</p>{m.evidence_link && <a href={m.evidence_link} target="_blank" rel="noopener noreferrer">Completion evidence ↗</a>}{admin && <OverlayAction label="Update milestone"><MilestoneForm projectId={project.id} milestone={m}/></OverlayAction>}</article>)}</div>{admin && <><OverlayAction label="Edit project / audience"><ProjectForm project={project}/></OverlayAction><OverlayAction label="Add milestone"><MilestoneForm projectId={project.id}/></OverlayAction></>}</Panel> }))}/>{!projects.length && <Empty>No progress updates have been published to your audience yet.</Empty>}</WorkspaceShell>;
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
}
