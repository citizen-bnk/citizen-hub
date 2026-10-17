"use client";
import { useState } from "react";
import { useAct } from "./Act";
import { reviewTransitions, statusLabels, type SubscriptionStatus } from "@/lib/subscriptions";

export function ReviewForm({ id, version, status, agreement, payment }: { id: string; version: number; status: SubscriptionStatus; agreement: string | null; payment: string | null }) {
  const options = reviewTransitions[status];
  const { act, busy, error } = useAct("/api/subscriptions");
  const [next, setNext] = useState<SubscriptionStatus>(options[0]);
  const [note, setNote] = useState("");
  const [agreementLink, setAgreementLink] = useState(agreement ?? "");
  const [paymentLink, setPaymentLink] = useState(payment ?? "");
  if (!options.length) return <p className="muted">This request is closed and cannot be changed.</p>;
  const paid = next === "received" || next === "pending_conversion";
  return <form className="review-form" onSubmit={(event) => { event.preventDefault(); void act({ action: "review", id, version, status: next, note, agreement_link: agreementLink, payment_link: paymentLink }); }}>
    <label>Move to<select value={next} onChange={(event) => setNext(event.target.value as SubscriptionStatus)}>{options.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}</select></label>
    <label>Note to the investor{next === "declined" || next === "received" ? " (required)" : ""}<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder={paid ? "How settlement was reconciled, for example the statement line and reference" : ""} /></label>
    <label>Agreement link (Google Drive)<input value={agreementLink} onChange={(event) => setAgreementLink(event.target.value)} placeholder="https://drive.google.com/file/d/…" /></label>
    <label>Payment evidence link (Google Drive)<input value={paymentLink} onChange={(event) => setPaymentLink(event.target.value)} placeholder="https://drive.google.com/file/d/…" /></label>
    {paid && <p className="muted">Confirming payment needs the signed agreement, the payment evidence and a note on how it was reconciled. It cannot be reversed here.</p>}
    {error && <div role="alert" className="form-error">{error}</div>}
    <button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save review"}</button>
  </form>;
}
