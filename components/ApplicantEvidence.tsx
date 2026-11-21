'use client';

import {OverlayAction} from '@/components/RecordUI';
import { useState } from 'react';
export function ApplicantEvidence({ id, version }: {
    id: string;
    version: number;
}) {
    const [busy, setBusy] = useState(false), [issue, setIssue] = useState('');
    async function upload(purpose: string, file: File) { setBusy(true); setIssue(''); try {
        const body = new FormData();
        body.set('purpose', purpose);
        body.set('file', file);
        const r = await fetch('/api/recruitment/upload', { method: 'POST', body, signal: AbortSignal.timeout(55000) }), d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        const result = await fetch('/api/recruitment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'identity_documents', id, version, purpose, url: d.url }) }), data = await result.json();
        if (!result.ok)
            throw Error(data.error);
        window.location.reload();
    }
    catch (e) {
        setIssue(e instanceof Error ? e.message : 'Upload failed. Select the file again to retry.');
    }
    finally {
        setBusy(false);
    } }
    return <OverlayAction label="Complete or replace identity evidence"><p className="muted">Private human identity review; no automated facial matching. JPEG/PNG, up to 3 MB.</p>{[['selfie', 'Recent selfie'], ['id_photo', 'Photo holding your ID']].map(([purpose, label]) => <label key={purpose}>{label}<input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" capture="user" disabled={busy} onChange={e => { const f = e.target.files?.[0]; if (f)
        void upload(purpose, f); e.target.value = ''; }}/></label>)}{busy && <p role="status">Saving privately…</p>}{issue && <p role="alert">{issue} Your other application information is saved.</p>}</OverlayAction>;
}
