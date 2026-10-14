"use client";
import {DriveAttachment} from './DriveAttachment';

import {OverlayAction} from '@/components/RecordUI';
import { useState } from 'react';
import { RecruitmentUpload } from './RecruitmentUpload';
import { transitions, validTransition } from '@/lib/recruitment-policy';
import type { Vacancy, Application } from '@/lib/recruitment';
async function post(data: unknown) { const r = await fetch('/api/recruitment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) }), d = await r.json(); if (!r.ok)
    throw Object.assign(Error(d.error || 'The request could not be completed.'), { code: d.code }); return d; }
function Issue({ message, retry }: {
    message: string;
    retry: () => void;
}) { return <div className="inline-error" role="alert"><p>{message}</p><div className="actions"><button className="button" type="button" onClick={retry}>Retry</button><button className="button" type="button" onClick={() => window.location.reload()}>Reload latest information</button><a className="button" href="/careers">Cancel</a></div></div>; }
export function ShareVacancy({ id }: {
    id: string;
}) { const [message, setMessage] = useState(''); return <><button className="button" onClick={async () => { try {
    const url = new URL('/careers?position=' + id, window.location.origin).href;
    if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Citizen career opportunity', url });
        setMessage('Shared.');
    }
    else {
        await navigator.clipboard.writeText(url);
        setMessage('Link copied.');
    }
}
catch (e) {
    setMessage(e instanceof Error && e.name === 'AbortError' ? 'Sharing cancelled.' : 'Copy the page address to share this position.');
} }}>Share opening</button>{message && <small role="status">{message}</small>}</>; }
export function CandidateResponse({ application, status, label }: {
    application: Application;
    status: 'accepted' | 'declined' | 'withdrawn';
    label: string;
}) { const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''); async function act() { setBusy(true); setError(''); try {
    await post({ action: 'candidate', id: application.id, version: application.version, status, confirmed: true });
    window.location.reload();
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Response could not be saved.');
    setBusy(false);
} } return <div>{!confirm ? <button className="button" onClick={() => setConfirm(true)}>{label}</button> : <><p>{status === 'accepted' ? 'I have reviewed the linked offer and want to accept its terms. Final appointment remains subject to approvals.' : status === 'declined' ? 'Decline this offer? This closes this application.' : 'Withdraw this application? This action closes it.'}</p><button className="button primary" disabled={busy} onClick={() => void act()}>Confirm {label.toLowerCase()}</button><button className="button" disabled={busy} onClick={() => setConfirm(false)}>Cancel</button></>}{error && <Issue message={error} retry={() => void act()}/>}</div>; }
export function ApplicationDocuments({ application: a }: {
    application: Application;
}) { const [cv, setCV] = useState(a.cv_link ?? ''), [references, setReferences] = useState(a.references_link ?? ''), [error, setError] = useState(''), [busy, setBusy] = useState(false); return <OverlayAction label="Update CV or references"><form className="readiness-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
    await post({ action: 'documents', id: a.id, version: a.version, cv_link: cv, references_link: references });
    window.location.reload();
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Documents could not be saved.');
    setBusy(false);
} }}><RecruitmentUpload purpose="cv" value={cv} onChange={setCV}/><RecruitmentUpload purpose="references" value={references} onChange={setReferences}/>{error && <p role="alert">{error}</p>}<button className="button" disabled={busy}>Save documents</button></form></OverlayAction>; }
export function CareerNotifications({ initial }: {
    initial: boolean;
}) { const [enabled, setEnabled] = useState(initial), [message, setMessage] = useState(''), [busy, setBusy] = useState(false); return <div><label className="checkbox-label"><input type="checkbox" checked={enabled} disabled={busy} onChange={async (e) => { const value = e.target.checked; setBusy(true); try {
    await post({ action: 'notifications', enabled: value });
    setEnabled(value);
    setMessage('Career notification preference saved.');
}
catch (e) {
    setMessage(e instanceof Error ? e.message : 'Preference could not be saved. Retry.');
}
finally {
    setBusy(false);
} }}/>Notify me about new career openings in Citizen Hub</label><p className="muted">Available to investors and shareholders. Application updates are always shown privately in My applications and Communications. Email delivery is being connected.</p>{message && <p role="status">{message}</p>}</div>; }
export function VacancyForm({ vacancy }: {
    vacancy?: Vacancy;
}) {
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function submit(form: HTMLFormElement) { const d = new FormData(form); setBusy(true); setError(''); try {
        await post({ action: 'vacancy', ...(vacancy ? { id: vacancy.id, version: vacancy.version } : {}), vacancy: { title: d.get('title'), summary: d.get('summary'), requirements: d.get('requirements'), location: d.get('location'), kind: d.get('kind'), phase: d.get('phase'), closes_at: new Date(String(d.get('closes_at'))).toISOString(), source_link: d.get('source_link'), status: d.get('status') } });
        window.location.assign('/recruitment');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Vacancy could not be saved.');
        setBusy(false);
    } }
    return <form className="readiness-form" onSubmit={e => { e.preventDefault(); void submit(e.currentTarget); }}><label>Position title<input name="title" placeholder="Example: Chief Risk Officer" defaultValue={vacancy?.title} required minLength={3} maxLength={150}/></label><label>Role summary<textarea name="summary" placeholder="Example: Lead Citizen’s risk framework during pre-licensing preparation and planned operations." defaultValue={vacancy?.summary} required minLength={20} maxLength={5000}/></label><label>Responsibilities and qualifications<textarea name="requirements" placeholder="Example: Relevant professional qualification and experience leading risk management in financial services." defaultValue={vacancy?.requirements} required minLength={20} maxLength={5000}/></label><label>Location<input name="location" placeholder="Example: Maseru, Lesotho" defaultValue={vacancy?.location ?? 'Lesotho / Southern Africa'} required/></label><label>Appointment type<select name="kind" defaultValue={vacancy?.kind ?? 'employment'}><option value="employment">Employment</option><option value="board">Board appointment</option></select></label><label>Business phase<select name="phase" defaultValue={vacancy?.phase ?? 'pre_licensing'}><option value="pre_licensing">Pre-licensing</option><option value="post_licensing">Post-licensing</option><option value="both">Succession across both phases</option></select></label><label>Closing date and time (your device’s local time)<input type="datetime-local" name="closes_at" required defaultValue={vacancy ? localDate(vacancy.closes_at) : ''}/></label><label>Google Drive source advertisement<DriveAttachment name="source_link" defaultValue={vacancy?.source_link} required/></label><label>Publication status<select name="status" defaultValue={vacancy?.status ?? 'draft'}>{['draft', 'open', 'paused', 'closed', 'filled'].map(s => <option key={s} value={s}>{s}</option>)}</select></label><p className="muted">Publishing makes this vacancy visible and sends one in-app notice to subscribed investors/shareholders. Reopening does not duplicate the notice. Current appointments are not changed.</p>{error && <p className="inline-error" role="alert">{error} Edit and retry, or reload if the record changed.</p>}<div className="actions"><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save position'}</button><a href="/recruitment" className="button">Cancel</a></div></form>;
}
function localDate(value: string) { const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
export function ApplicationReview({ application: a }: {
    application: Application;
}) {
    const next = (transitions[a.status] ?? []).filter(s => validTransition(a.status, s, a.kind) && !['withdrawn', 'accepted', 'declined'].includes(s)), [busy, setBusy] = useState(false), [error, setError] = useState('');
    if (!next.length)
        return <p className="muted">{a.status === 'offered' ? 'Waiting for the candidate to accept or decline the offer.' : 'No further admin steps are available.'}</p>;
    async function submit(form: HTMLFormElement) { const d = new FormData(form); setBusy(true); setError(''); try {
        await post({ action: 'review', id: a.id, version: a.version, status: d.get('status'), candidate_note: d.get('candidate_note'), offer_link: d.get('offer_link'), contract_link: d.get('contract_link'), approval_link: d.get('approval_link'), regulatory_link: d.get('regulatory_link'), start_date: d.get('start_date'), conditions_confirmed: d.get('conditions_confirmed') === 'on' });
        window.location.reload();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Review could not be saved.');
        setBusy(false);
    } }
    return <form className="readiness-form" onSubmit={e => { e.preventDefault(); void submit(e.currentTarget); }}><label>Next step<select name="status">{next.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}</select></label><label>Update visible to the candidate<textarea name="candidate_note" required minLength={5} maxLength={3000} placeholder="Example: Your interview is scheduled for 20 October at 10:00. Please confirm your availability."/></label>{[['offer_link', 'Approved offer', a.offer_link], ['contract_link', 'Signed agreement / acceptance', a.contract_link], ['approval_link', 'Company appointment approval', a.approval_link], ['regulatory_link', 'Regulatory approval evidence (board)', a.regulatory_link]].map(([name, label, value]) => <label key={name}>{label}<DriveAttachment name={name!} defaultValue={value ?? ''}/></label>)}<label>Start date<input name="start_date" type="date" defaultValue={a.start_date?.slice(0, 10) ?? ''}/></label><label className="checkbox-label"><input name="conditions_confirmed" type="checkbox" defaultChecked={a.conditions_confirmed}/>I have reviewed the linked evidence and confirm all appointment and onboarding conditions are met.</label><p className="muted">These documents stay in Drive. Share only with the relevant candidate and authorised reviewers. Employment decisions remain human decisions. This workflow does not grant system roles or replace corporate-register reconciliation.</p>{error && <p className="inline-error" role="alert">{error} Correct the information and retry, or reload the latest record.</p>}<button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save next step'}</button></form>;
}
