"use client";
import { useMemo, useRef, useState } from "react";
import { useAct } from "./Act";

type Offer = { id: string; version: number; title: string; instrument: string; currency: string; unitPrice: string; min: number; max: number | null };
const steps = ["How many units?", "Where will the money come from?", "Why are you investing?", "Review and confirm"] as const;

function format(minor: bigint, currency: string) {
  const text = minor.toString().padStart(3, "0");
  const whole = text.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${currency} ${whole}.${text.slice(-2)}`;
}

/** One question at a time. The price shown is informational; the server derives the amount from the opportunity. */
export function SubscribeFlow({ offer }: { offer: Offer }) {
  const key = useRef(crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState(String(offer.min));
  const [source, setSource] = useState("");
  const [purpose, setPurpose] = useState("");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState<{ amount: string } | null>(null);
  const { act, busy, error } = useAct("/api/subscriptions");

  const count = Number(units);
  const unitProblem = !Number.isInteger(count) || count <= 0 ? "Enter a whole number of units."
    : count < offer.min ? `The minimum is ${offer.min.toLocaleString()} units.`
    : offer.max !== null && count > offer.max ? `The maximum is ${offer.max.toLocaleString()} units.` : null;
  const total = useMemo(() => {
    if (unitProblem) return null;
    return BigInt(count) * BigInt(Math.round(Number(offer.unitPrice) * 100));
  }, [count, unitProblem, offer.unitPrice]);

  const valid = [!unitProblem, source.trim().length >= 3, purpose.trim().length >= 3, consent][step];

  async function confirm() {
    const ok = await act({ action: "subscribe", request_key: key.current, opportunity_id: offer.id, version: offer.version, units: count, source_of_funds: source.trim(), purpose: purpose.trim(), consent: true });
    if (ok) setDone({ amount: total ? format(total, offer.currency) : "" });
  }

  if (done) return <section className="guided-form" role="status"><h2>Request received</h2><p>Your request for {count.toLocaleString()} units ({done.amount}) has been recorded. A reviewer will contact you about the agreement and payment. Nothing has been charged.</p><a className="button primary" href="/subscriptions">View my subscriptions</a></section>;

  return <section className="guided-form">
    <div className="step-progress"><span>SUBSCRIBE · {offer.title.toUpperCase()}</span><small>{step + 1} of {steps.length}</small></div>
    <h2>{steps[step]}</h2>
    {step === 0 && <>
      <p>{offer.instrument} at {format(BigInt(Math.round(Number(offer.unitPrice) * 100)), offer.currency)} per unit. Minimum {offer.min.toLocaleString()}{offer.max !== null ? `, maximum ${offer.max.toLocaleString()}` : ""}.</p>
      <label className="sr-only" htmlFor="units">Number of units</label>
      <input id="units" inputMode="numeric" value={units} onChange={(event) => setUnits(event.target.value.replace(/[^\d]/g, ""))} />
      <div className="button-row">{[1, 2, 5, 10].map((multiple) => <button key={multiple} type="button" className="button subtle" onClick={() => setUnits(String(offer.min * multiple))}>{(offer.min * multiple).toLocaleString()}</button>)}</div>
      {unitProblem ? <div className="form-error" role="alert">{unitProblem}</div> : total && <p className="calculator">Total: <strong>{format(total, offer.currency)}</strong></p>}
    </>}
    {step === 1 && <><p>We are required to understand the source of the funds you intend to use.</p><label className="sr-only" htmlFor="source">Source of funds</label><textarea id="source" value={source} maxLength={2000} onChange={(event) => setSource(event.target.value)} placeholder="For example: salary savings, business income, sale of property" /></>}
    {step === 2 && <><p>Tell us what you hope to achieve. This is not a promise of any return.</p><label className="sr-only" htmlFor="purpose">Investment objective</label><textarea id="purpose" value={purpose} maxLength={2000} onChange={(event) => setPurpose(event.target.value)} /></>}
    {step === 3 && <>
      <dl className="profile-details"><div><dt>Opportunity</dt><dd>{offer.title}</dd></div><div><dt>Units</dt><dd>{count.toLocaleString()}</dd></div><div><dt>Total</dt><dd>{total ? format(total, offer.currency) : "—"}</dd></div><div><dt>Source of funds</dt><dd>{source}</dd></div><div><dt>Objective</dt><dd>{purpose}</dd></div></dl>
      <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I have read the published terms. I understand this is a request that will be reviewed, that Citizen Digital Ltd is in pre-licensing, and that no shares are allotted by submitting it.</label>
    </>}
    {error && <div role="alert" className="form-error">{error}</div>}
    <div className="button-row">
      {step > 0 && <button className="button" disabled={busy} onClick={() => setStep(step - 1)}>Back</button>}
      <button className="button primary" disabled={!valid || busy} onClick={() => (step < steps.length - 1 ? setStep(step + 1) : void confirm())}>{busy ? "Submitting…" : step < steps.length - 1 ? "Continue →" : "Submit request"}</button>
      <a className="button subtle" href="/opportunities">Cancel</a>
    </div>
  </section>;
}
