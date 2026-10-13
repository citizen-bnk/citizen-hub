"use client";

import {OverlayAction} from '@/components/RecordUI';
import { useState } from 'react';
import type { EvidenceSource, ReadinessItem, Finding } from '@/lib/readiness';
function useSave() {
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function save(payload: Record<string, unknown>) { setBusy(true); setError(''); try {
        const response = await fetch('/api/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
        const result = await response.json();
        if (!response.ok)
            throw Error(`${result.error} (${result.code})`);
        window.location.reload();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'The request failed. Retry or cancel.');
    }
    finally {
        setBusy(false);
    } }
    return { busy, error, setError, save };
}
function FormError({ error, retry, cancel }: {
    error: string;
    retry: () => void;
    cancel: () => void;
}) { return error ? <div className="inline-error" role="alert">{error}<div className="actions">{!/(DENIED|REQUIRED|CHANGED)/.test(error) && <button type="button" onClick={retry}>Retry</button>}<button type="button" onClick={() => window.location.reload()}>Reload latest</button><button type="button" onClick={cancel}>Cancel</button></div></div> : null; }
export function ReadinessForm({ item }: {
    item: ReadinessItem;
}) {
    const [step, setStep] = useState(0), [value, setValue] = useState(item.replacement_value), [link, setLink] = useState(item.evidence_link || ''), [note, setNote] = useState(item.review_note), [due, setDue] = useState(item.due_date?.slice(0, 10) || ''), [status, setStatus] = useState(item.status === 'verified' ? 'in_progress' : item.status);
    const action = useSave();
    const titles = ['What information completes this item?', 'Where is its supporting evidence?', 'When should this item be ready?', 'What should the reviewer know?', 'How would you like to save it?'];
    const payload = { action: 'update_item', id: item.id, version: item.version, replacement_value: value, evidence_link: link, review_note: note, due_date: due, status };
    return <form className="readiness-form" onSubmit={e => { e.preventDefault(); if (step < 4)
        setStep(step + 1);
    else
        void action.save(payload); }}>
 <span className="eyebrow">ITEM {item.source_number} · {item.doc_ref} · STEP {step + 1} OF 5</span><h2>{titles[step]}</h2><p className="muted">{item.item}</p>
 {step === 0 && <textarea aria-label="Completed information" maxLength={2000} value={value} onChange={e => setValue(e.target.value)} placeholder="Enter verified information; leave unknown facts open."/>}
 {step === 1 && <><input aria-label="Google Drive evidence link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://drive.google.com/file/d/.../view"/><p className="muted">Keep the original in Drive. A shared link does not by itself prove execution or regulatory approval.</p></>}
 {step === 2 && <input aria-label="Target completion date" type="date" value={due} onChange={e => setDue(e.target.value)}/>}
 {step === 3 && <textarea aria-label="Review note" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain the source, any conflicts and checks still needed."/>}
 {step === 4 && <><select aria-label="Item status" value={status} onChange={e => setStatus(e.target.value)}><option value="open">Keep open</option><option value="in_progress">Work in progress</option><option value="submitted">Request independent verification</option></select><p className="muted">Verification needs completed information, Drive evidence and a different authorised reviewer. It records internal readiness, not CBL approval.</p></>}
 <FormError error={action.error} retry={() => void action.save(payload)} cancel={() => action.setError('')}/><div className="actions">{step > 0 && <button className="button" type="button" onClick={() => setStep(step - 1)}>Back</button>}<button className="button primary" disabled={action.busy}>{action.busy ? 'Saving…' : step < 4 ? 'Continue' : 'Save item'}</button><a className="button" href="/licensing">Cancel</a></div></form>;
}
export function FindingForm() {
    const [step, setStep] = useState(0), [system, setSystem] = useState('hub'), [title, setTitle] = useState(''), [details, setDetails] = useState(''), [severity, setSeverity] = useState('medium');
    const action = useSave();
    const payload = { action: 'create_finding', system, title, details, severity };
    const titles = ['Which system did you test?', 'What did you find?', 'How can we reproduce it?', 'How serious is the issue?'];
    return <form className="readiness-form" onSubmit={e => { e.preventDefault(); if (step < 3)
        setStep(step + 1);
    else
        void action.save(payload); }}><span className="eyebrow">TEST FINDING · STEP {step + 1} OF 4</span><h2>{titles[step]}</h2>
 {step === 0 && <select aria-label="System tested" value={system} onChange={e => setSystem(e.target.value)}>{['website', 'hub', 'banking', 'app', 'core', 'evidence'].map(s => <option key={s} value={s}>{s}</option>)}</select>}
 {step === 1 && <input required minLength={5} maxLength={200} aria-label="Finding title" placeholder="Example: Portfolio does not refresh after subscribing" value={title} onChange={e => setTitle(e.target.value)}/>}
 {step === 2 && <><textarea required minLength={10} maxLength={4000} aria-label="Reproduction details" value={details} onChange={e => setDetails(e.target.value)} placeholder="Steps, expected result and actual result"/><p className="muted">Use fictional customer information. Do not include passwords, credentials or personal identity documents.</p></>}
 {step === 3 && <select aria-label="Severity" value={severity} onChange={e => setSeverity(e.target.value)}>{['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}</select>}
 <FormError error={action.error} retry={() => void action.save(payload)} cancel={() => action.setError('')}/><div className="actions">{step > 0 && <button type="button" className="button" onClick={() => setStep(step - 1)}>Back</button>}<button className="button primary" disabled={action.busy}>{action.busy ? 'Saving…' : step < 3 ? 'Continue' : 'Submit finding'}</button><a className="button" href="/review">Cancel</a></div></form>;
}
export function ReviewerGrantForm({ sources }: {
    sources: EvidenceSource[];
}) {
    const [email, setEmail] = useState(''), [source, setSource] = useState(sources[0]?.id || ''), [expiry, setExpiry] = useState(''), [checked, setChecked] = useState(false);
    const action = useSave();
    function payload() { return { action: 'grant_review', email, source_id: source, expires_at: new Date(expiry + 'T23:59:59Z').toISOString(), drive_access_checked: checked }; }
    return <form className="readiness-form" onSubmit={e => { e.preventDefault(); void action.save(payload()); }}><h3>Release one source to a named reviewer</h3><label>Existing account email<input required type="email" placeholder="Example: reviewer@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label><label>Evidence source<select required value={source} onChange={e => setSource(e.target.value)}>{sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label>Access expiry (within 30 days)<input required type="date" value={expiry} onChange={e => setExpiry(e.target.value)}/></label><label className="checkbox-label"><input required type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}/>I have approved this source for this reviewer and checked their Google Drive access.</label><p className="muted">Assign the reviewer role under User access first. No Drive permissions change automatically. Reviewers see only released sources and their own findings; no company editing or banking rights are granted.</p><FormError error={action.error} retry={() => void action.save(payload())} cancel={() => action.setError('')}/><button className="button primary" disabled={action.busy || !sources.length}>{action.busy ? 'Saving…' : 'Release evidence'}</button></form>;
}
export function FindingResolutionForm({ finding }: {
    finding: Finding;
}) {
    const [status, setStatus] = useState('triaged'), [note, setNote] = useState('');
    const action = useSave();
    const payload = { action: 'update_finding', id: finding.id, version: finding.version, status, resolution_note: note };
    return <OverlayAction label="Record investigation or remediation"><form className="readiness-form" onSubmit={e => { e.preventDefault(); void action.save(payload); }}><label>Work status<select value={status} onChange={e => setStatus(e.target.value)}><option value="triaged">Investigating</option><option value="fixed">Fix ready for reviewer retest</option></select></label><label>Response and verification evidence<textarea required minLength={5} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the change, release/version and checks performed."/></label><FormError error={action.error} retry={() => void action.save(payload)} cancel={() => action.setError('')}/><button className="button" disabled={action.busy}>{action.busy ? 'Saving…' : 'Save response'}</button></form></OverlayAction>;
}
