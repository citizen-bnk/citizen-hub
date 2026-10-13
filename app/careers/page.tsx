import {OverlayAction} from '@/components/RecordUI';
import { currentPerson } from '@/lib/session';
import { vacancies, applications, applicationEvents, recruiter } from '@/lib/recruitment';
import { query, ServiceIssue } from '@/lib/db';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Hero, Panel, Empty } from '@/components/BoardView';
import { Recovery } from '@/components/Recovery';
import { ApplicationDocuments, CandidateResponse, CareerNotifications, ShareVacancy } from '@/components/RecruitmentForms';
import { ApplicantEvidence } from '@/components/ApplicantEvidence';
import { ApplicantJourney } from '@/components/ApplicantJourney';
import { PositionContext } from '@/components/PositionContext';
import { CareerIllustration } from '@/components/CareerIllustration';
import { careerDetails } from '@/lib/career-details';
import { driveUploadReady } from '@/lib/drive-upload';
export const dynamic = 'force-dynamic';
export default async function Careers({ searchParams }: {
    searchParams: Promise<{
        position?: string;
        apply?: string;
    }>;
}) {
    try {
        const person = await currentPerson(), params = await searchParams;
        const [positions, own, events, pref] = await Promise.all([vacancies(person), person ? applications(person) : [], person ? applicationEvents(person) : [], person ? query<{
                preferences: {
                    career_updates?: boolean;
                };
            }>('SELECT preferences FROM hub_people WHERE id=$1 AND scope=$2', [person.id, person.scope]) : []]);
        const selected = positions.find(v => v.id === params.position), applying = positions.find(v => v.id === params.apply), candidateApplications = person ? own.filter(a => a.person_id === person.id) : [], focusPosition = applying || selected;
        const content = <><Hero title={applying?.title || 'Careers at Citizen'} subtitle={applying ? 'Citizen Digital Ltd' : 'Make your next move.'} description={applying ? applying.location : 'Explore leadership and governance opportunities.'}/>
 {person && recruiter(person) && <div className="actions career-toolbar"><a className="button" href="/recruitment">Manage recruitment</a></div>}<div className="dashboard-layout"><div className="primary-column">{applying ? <Panel title="Your application" className="application-panel"><ApplicantJourney vacancy={applying} person={person} uploadsAvailable={await driveUploadReady(person?.scope || 'live')}/></Panel> : <Panel title={selected ? 'Position details' : 'Available positions'}>{(params.position && !selected || params.apply && !applying) && <p className="access-error">That position is unavailable or has closed. Choose an available position below.</p>}<div className="opportunity-grid">{(selected ? [selected] : positions.filter(v => v.status === 'open' && new Date(v.closes_at) > new Date())).map(v => <article key={v.id} className="opportunity-card"><span className="chip">{v.kind === 'board' ? 'Board appointment' : 'Employment'}</span><h2>{v.title}</h2><p>{careerDetails(v).responsibilities[0]}</p><p>{v.location} · {v.phase.replaceAll('_', ' ')}</p><p><strong>Closes:</strong> {new Date(v.closes_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST</p><p className="muted">{careerDetails(v).qualifications[0]}</p><div className="actions career-card-actions"><a className="button" href={'/careers?position=' + v.id}>Job details</a>{candidateApplications.some(a => a.vacancy_id === v.id) ? <a className="button primary" href="#applications">View my application</a> : <a className="button primary" href={'/careers?apply=' + v.id}>Apply for this position</a>}<ShareVacancy id={v.id}/></div></article>)}</div>{!positions.length && <Empty>No positions are currently open. Return later for new opportunities.</Empty>}{selected && <a className="button" href="/careers">All positions</a>}</Panel>}
 {person && !applying && <section id="applications"><Panel title="My applications">{!candidateApplications.length ? <Empty>You have not submitted an application yet.</Empty> : candidateApplications.map(a => <article className="finding-row" key={a.id}><h3>{a.title}</h3><span className="chip">{a.status.replaceAll('_', ' ')}</span><p>{a.candidate_note || 'Application received. Awaiting review.'}</p>{a.cv_link && <a href={a.cv_link} target="_blank" rel="noopener noreferrer">My CV ↗</a>}{['submitted', 'under_review', 'shortlisted', 'interview', 'checks'].includes(a.status) && <><ApplicationDocuments application={a}/><ApplicantEvidence id={a.id} version={a.version}/></>}{a.offer_link && <a className="button" href={a.offer_link} target="_blank" rel="noopener noreferrer">Review offer ↗</a>}{a.status === 'offered' && <div className="actions"><CandidateResponse application={a} status="accepted" label="Accept offer"/><CandidateResponse application={a} status="declined" label="Decline offer"/></div>}{!['employed', 'appointed', 'rejected', 'withdrawn', 'declined'].includes(a.status) && <CandidateResponse application={a} status="withdrawn" label="Withdraw application"/>}<OverlayAction label="Application timeline">{events.filter(e => e.application_id === a.id).map((e, i) => <p key={i}><strong>{e.status.replaceAll('_', ' ')}</strong> · {new Date(e.created_at).toLocaleDateString('en-ZA')}<br />{e.note}</p>)}</OverlayAction></article>)}</Panel></section>}</div>
 <aside className="context-column career-context">{focusPosition ? <PositionContext vacancy={focusPosition}/> : <Panel title="Opportunities at Citizen" className="position-context"><CareerIllustration kind="team"/><h3>Leadership. Expertise. Impact.</h3><p>Senior management and board opportunities at Citizen Digital Ltd.</p><div className="career-category-tags"><span className="chip">Leadership</span><span className="chip">Finance & risk</span><span className="chip">Governance</span></div></Panel>}{person && !applying && <Panel title="Career updates"><CareerNotifications initial={pref[0]?.preferences?.career_updates !== false}/></Panel>}</aside></div></>;
        return person ? <WorkspaceShell person={person} active="careers">{content}</WorkspaceShell> : <main id="main" className="public-opportunities careers-page"><a className="button" href={process.env.NEXT_PUBLIC_WEBSITE_URL}>← Citizen Bank website</a>{content}</main>;
    }
    catch (e) {
        if (e instanceof ServiceIssue)
            return <Recovery code={e.code} message={e.message}/>;
        throw e;
    }
}
