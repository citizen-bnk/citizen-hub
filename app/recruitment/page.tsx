import { RecordControls } from '@/components/RecordUI';
import { RecordList } from '@/components/RecordUI';
import { recordMetadata } from '@/lib/record-list';
import { OverlayAction, RecordActions } from '@/components/RecordUI';
import { redirect } from 'next/navigation';
import { currentPerson } from '@/lib/session';
import { vacancies, applications, applicationEvents, recruiter } from '@/lib/recruitment';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Hero, Panel, Empty } from '@/components/BoardView';
import { Recovery } from '@/components/Recovery';
import { ServiceIssue } from '@/lib/db';
import { VacancyForm, ApplicationReview } from '@/components/RecruitmentForms';
export const dynamic = 'force-dynamic';
export default async function Recruitment({ searchParams }: {
    searchParams: Promise<{
        edit?: string;
        new?: string;
        position?: string;
        status?: string;
    }>;
}) {
    try {
        const person = await currentPerson();
        if (!person)
            redirect('/login?next=/recruitment');
        if (!recruiter(person))
            return <Recovery code="RECRUITMENT_ACCESS_DENIED" message="Only administrators can manage recruitment. View vacancies and your own applications in Careers."/>;
        const params = await searchParams, [positions, all, events] = await Promise.all([vacancies(person), applications(person), applicationEvents(person)]), edit = positions.find(v => v.id === params.edit), filtered = all.filter(a => (!params.position || a.vacancy_id === params.position) && (!params.status || a.status === params.status));
        return <WorkspaceShell person={person} active="recruitment"><Hero title="Recruitment & Appointments" subtitle="From opportunity to approved appointment." description="Manage vacancies, applications, interviews, checks, offers and onboarding. Only administrators edit recruitment records."/><div className="actions"><OverlayAction primary label="Create position"><VacancyForm /></OverlayAction><a className="button" href="/careers">View applicant experience</a><a className="button" href="/administration">Corporate records</a></div><div className="dashboard-layout"><div className="primary-column">{params.new === '1' || edit ? <Panel title={edit ? 'Edit position' : 'New position'}><VacancyForm vacancy={edit}/></Panel> : <Panel title="Positions"><RecordList label="Positions" records={positions.map(v => ({ ...recordMetadata(v), content: <article className="finding-row" key={v.id}><h3>{v.title}</h3><span className="chip">{v.status}</span><p>{v.location} · closes {new Date(v.closes_at).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p><RecordControls><div className="actions"><OverlayAction label="Edit position"><VacancyForm vacancy={v}/></OverlayAction><a className="button" href={'/recruitment?position=' + v.id + '#queue'}>Applications ({all.filter(a => a.vacancy_id === v.id).length})</a></div></RecordControls></article> }))}/></Panel>}
 <section id="queue"><Panel title="Application pipeline"><form className="subscription-filters"><label>Position<select name="position" defaultValue={params.position ?? ''}><option value="">All positions</option>{positions.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></label><label>Status<select name="status" defaultValue={params.status ?? ''}><option value="">All stages</option>{['submitted', 'under_review', 'shortlisted', 'interview', 'checks', 'offered', 'accepted', 'onboarding', 'employed', 'appointed', 'rejected', 'withdrawn', 'declined'].map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}</select></label><button className="button">Filter</button></form><p className="muted">Showing up to 200 recent applications in this scope. No private applications appear on public careers pages.</p>{!filtered.length ? <Empty>No applications match this view.</Empty> : <RecordList label="Applications" records={filtered.map(a => ({ ...recordMetadata(a), content: <article className="finding-row" key={a.id}><h3>{a.display_name} · {a.title}</h3><span className="chip">{a.status.replaceAll('_', ' ')}</span><p><a href={"mailto:" + a.email}>{a.email}</a>{a.phone && <> · <a href={"tel:" + a.phone}>{a.phone}</a></>}</p><p className="application-statement">{a.cover_statement}</p><RecordControls><div className="actions">{a.cv_link && <a className="button" href={a.cv_link} target="_blank" rel="noopener noreferrer">Review CV ↗</a>}{a.references_link && <a className="button" href={a.references_link} target="_blank" rel="noopener noreferrer">References ↗</a>}</div><RecordActions name="this record" actions={[{ label: "Applicant answers and private evidence", content: <>{Object.entries(a.applicant_details || {}).filter(([key]) => !['request_key', 'vacancy_id', 'vacancy_version', 'cv_link', 'references_link'].includes(key)).map(([key, value]) => <div key={key} className="finding-row"><strong>{key.replaceAll('_', ' ')}</strong>{key.endsWith('_link') && typeof value === 'string' && value ? <a className="button" href={value} target="_blank" rel="noopener noreferrer">View private evidence ↗</a> : <p className="application-statement">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'Pending')}</p>}</div>)}<p className="muted">Declarations require human assessment, not automated rejection. Formal suitability checks and evidence remain separate.</p></> }, { label: "Review and progress application", content: <><ApplicationReview application={a}/></> }, { label: "History", content: <>{events.filter(e => e.application_id === a.id).map((e, i) => <p key={i}><strong>{e.status.replaceAll('_', ' ')}</strong> · {new Date(e.created_at).toLocaleDateString('en-ZA')}<br />{e.note}</p>)}</> }]}/></RecordControls><p className="muted">Contact: {a.contact_verified ? 'Verified' : 'Unverified — verify before offer'}</p></article> }))}/>}</Panel></section></div><aside className="context-column"><Panel title="Appointment controls"><p className="muted">A candidate must accept the approved offer before onboarding. Completing employment requires a signed agreement, company approval, start date and confirmed conditions. Board appointments additionally require regulatory approval evidence.</p><p className="muted">Recruitment does not overwrite existing corporate appointments or automatically grant privileged system roles.</p><a href="https://drive.google.com/file/d/1Sts2xqApwP-C75ksK_PSAGKUuk5Sm15A/view" target="_blank" rel="noopener noreferrer">Board appointment procedure ↗</a></Panel><Panel title="Notifications"><p className="muted">New openings notify investors and shareholders in Citizen Hub. Candidates receive private in-app updates. Email delivery awaits the transactional email connection.</p></Panel><Panel title="Current business status"><p className="muted">Pre-licensing. CEO and Chair recruitment covers succession/replacement across pre- and post-licensing stages. Source dates are amendable company plans, not regulatory guarantees.</p></Panel></aside></div></WorkspaceShell>;
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
}
