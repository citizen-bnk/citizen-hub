"use client";
import { useState } from "react";
import { useAct } from "./Act";

const FormError = ({ message }: { message: string | null }) => message ? <div role="alert" className="form-error">{message}</div> : null;

export function QuestionForm() {
  const { act, busy, error } = useAct("/api/dataroom");
  const [text, setText] = useState("");
  return <form className="review-form" onSubmit={async (event) => { event.preventDefault(); if (await act({ action: "question", question: text })) setText(""); }}>
    <label>Ask the team<textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} placeholder="Your question about the offer, the company or its documents" /></label>
    <FormError message={error} /><button className="button primary" disabled={busy || text.trim().length < 3}>{busy ? "Sending…" : "Send question"}</button>
  </form>;
}

export function AnswerForm({ id }: { id: string }) {
  const { act, busy, error } = useAct("/api/dataroom");
  const [text, setText] = useState("");
  return <form className="review-form" onSubmit={async (event) => { event.preventDefault(); if (await act({ action: "answer", id, answer: text })) setText(""); }}>
    <label>Your answer<textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} /></label>
    <FormError message={error} /><button className="button" disabled={busy || text.trim().length < 3}>{busy ? "Saving…" : "Reply"}</button>
  </form>;
}

export function GrantForm() {
  const { act, busy, error } = useAct("/api/dataroom");
  const [email, setEmail] = useState(""), [stage, setStage] = useState(2), [evidence, setEvidence] = useState("");
  return <form className="review-form" onSubmit={async (event) => { event.preventDefault(); if (await act({ action: "grant", email, stage, evidence })) { setEmail(""); setEvidence(""); } }}>
    <label>Investor email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>Open up to stage<select value={stage} onChange={(event) => setStage(Number(event.target.value))}>{[2, 3, 4, 5].map((value) => <option key={value} value={value}>Stage {value}</option>)}</select></label>
    <label>Evidence (NDA or KYC clearance, Google Drive link)<input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="https://drive.google.com/file/d/…" /></label>
    <FormError message={error} /><button className="button primary" disabled={busy || !email || !evidence}>{busy ? "Granting…" : "Grant access"}</button>
  </form>;
}

export function AddDocumentForm() {
  const { act, busy, error } = useAct("/api/dataroom");
  const [v, setV] = useState({ title: "", category: "", summary: "", link: "", stage: 1 });
  const set = (key: string, value: string | number) => setV({ ...v, [key]: value });
  return <form className="review-form" onSubmit={async (event) => { event.preventDefault(); if (await act({ action: "add", ...v })) setV({ title: "", category: "", summary: "", link: "", stage: 1 }); }}>
    <label>Title<input value={v.title} onChange={(event) => set("title", event.target.value)} /></label>
    <label>Category<input value={v.category} onChange={(event) => set("category", event.target.value)} placeholder="Corporate, Financial, Legal…" /></label>
    <label>Summary<textarea value={v.summary} onChange={(event) => set("summary", event.target.value)} maxLength={1000} /></label>
    <label>Google Drive link<input value={v.link} onChange={(event) => set("link", event.target.value)} placeholder="https://drive.google.com/file/d/…" /></label>
    <label>Stage<select value={v.stage} onChange={(event) => set("stage", Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Stage {value}</option>)}</select></label>
    <p className="muted">New documents start as drafts. Release them from the list when they are ready.</p>
    <FormError message={error} /><button className="button primary" disabled={busy || !v.title || !v.link}>{busy ? "Adding…" : "Add as draft"}</button>
  </form>;
}
