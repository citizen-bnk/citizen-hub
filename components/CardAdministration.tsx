'use client';

import {OverlayAction} from '@/components/RecordUI';
import { useState } from 'react';
export type ManagedCard = {
    id: string;
    account_id?:string|null;
    allow_mixed_card_forms?:boolean;
    label: string;
    last4: string;
    brand: string;
    form: string;
    status: 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'ORDERED';
    archived_at: string | null;
    first_name: string;
    last_name: string;
    email: string;
    history: {
        action: string;
        reason: string;
        at: string;
    }[] | null;
};
export function CardAdministration({ card: c }: {
    card: ManagedCard;
}) { const [busy, setBusy] = useState(false), [issue, setIssue] = useState(''); const recovery = c.archived_at ? ['restore'] : c.status === 'BLOCKED' ? ['replace', 'archive'] : c.status === 'FROZEN' ? ['restore', 'archive'] : ['archive'];const actions=[...recovery,...(c.account_id?[c.allow_mixed_card_forms?'restrict_forms':'allow_forms']:[])]; return <article className="stakeholder-card"><h3>{c.first_name} {c.last_name} · {c.label}</h3><p>{c.brand} · •••• {c.last4} · {c.form.toLowerCase()}</p><span className="chip">{c.archived_at ? 'Archived · ' : ''}{c.status.toLowerCase()}</span><p className="muted">Temporary freezes can be lifted. Archived records can be restored. Lost/stolen or permanently blocked cards receive replacement details; their old details stay blocked.</p><form className="readiness-form" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); setIssue(''); try {
    const r = await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: data.get('action'), id: c.id, expected_status: c.status, expected_archived: !!c.archived_at, reason: data.get('reason'), confirmed: data.get('confirmed') === 'on' }), signal: AbortSignal.timeout(55000) }), d = await r.json();
    if (!r.ok)
        throw Error(d.error);
    window.location.reload();
}
catch (e) {
    setIssue(e instanceof Error ? e.message : 'Unable to recover the card. Retry or reload.');
}
finally {
    setBusy(false);
} }}><label>Recovery action<select name="action">{actions.map(a => <option key={a} value={a}>{a==='allow_forms'?'Approve virtual + physical cards':a==='restrict_forms'?'Restrict account to one form':a === 'replace' ? 'Issue replacement details' : a === 'restore' ? 'Restore record / lift temporary freeze' : 'Archive card (recoverable)'}</option>)}</select></label><label>Reason<textarea name="reason" required minLength={10} maxLength={1000} placeholder="Example: Customer identity checked; temporary security hold resolved. Case reference CB-102."/></label><label className="checkbox-label"><input type="checkbox" name="confirmed" required/>I have verified the customer and reviewed this recovery action.</label><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Confirm action'}</button>{issue && <p role="alert">{issue} Correct the information or reload before retrying. <a className="button" href="/login?next=/cards">Sign in again</a></p>}</form>{c.history?.length ? <OverlayAction label="Recovery history">{c.history.map((h, i) => <p key={i}><strong>{h.action}</strong> · {new Date(h.at).toLocaleString('en-ZA')}<br />{h.reason}</p>)}</OverlayAction> : null}</article>; }
