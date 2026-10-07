import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, Panel, PrimaryButton, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { date } from "@/platform/format";
import { useNcnda, useSign } from "../hooks";
import { emptyLoi, signingErrors, unsigned, type AgreementKey, type AgreementRow, type LoiForm } from "../logic";

const TEXT: Record<Exclude<AgreementKey, "ncnda">, string> = {
  terms: "I accept the terms and conditions for using the data room: the documents are confidential, are for my own evaluation of an investment, and every time I open one is recorded.",
  letter_of_intent: "I confirm my intention to invest and give the details below so the office can review them.",
};

/** Shown until the three agreements are signed: read each one, tick what you accept, sign once. */
export default function AgreementsGate({ rows }: { rows: AgreementRow[] }) {
  const todo = unsigned(rows);
  const ncnda = useNcnda(todo.some((r) => r.key === "ncnda"));
  const sign = useSign();
  const [picked, setPicked] = useState<AgreementKey[]>(todo.map((r) => r.key));
  const [signature, setSignature] = useState("");
  const [loi, setLoi] = useState<LoiForm>(emptyLoi);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (k: AgreementKey, on: boolean) => setPicked((p) => (on ? [...p, k] : p.filter((x) => x !== k)));
  const set = (k: keyof LoiForm) => (e: React.ChangeEvent<HTMLInputElement>) => setLoi((l) => ({ ...l, [k]: e.target.value }));

  const submit = () => {
    const clean = signingErrors(signature, picked, loi);
    setErrors(clean);
    if (Object.keys(clean).length || picked.length === 0) return;
    sign.mutate({ signature: signature.trim(), keys: picked, ncndaVersion: ncnda.data?.version ?? "1.0", loi });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The data room holds confidential banking-licence documents. Read and sign the agreements below to open it. Your signature is your typed name, recorded with the time and your address.
      </p>
      {todo.map((r) => (
        <Panel key={r.key} title={r.label} actions={<Status value="not signed" />}>
          {r.key === "ncnda" ? (
            <PageState query={ncnda}>
              {(n) => (
                <div>
                  <div className="mb-2 text-xs text-muted-foreground">Version {n.version}, effective {date(n.effective_date)}</div>
                  <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm">{n.content}</div>
                </div>
              )}
            </PageState>
          ) : (
            <p className="text-sm">{TEXT[r.key]}</p>
          )}
          {r.key === "letter_of_intent" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Investor name" value={loi.investor_name} onChange={set("investor_name")} error={errors.investor_name} />
              <Field label="Entity name (if investing as a company)" value={loi.entity_name} onChange={set("entity_name")} />
              <Field label="Entity type" value={loi.entity_type} onChange={set("entity_type")} />
              <Field label="Registration number" value={loi.registration_number} onChange={set("registration_number")} />
              <Field label="Intended investment amount" inputMode="decimal" value={loi.investment_amount} onChange={set("investment_amount")} error={errors.investment_amount} />
              <Field label="Currency" value={loi.investment_currency} onChange={set("investment_currency")} error={errors.investment_currency} />
              <Field label="Contact email" type="email" value={loi.contact_email} onChange={set("contact_email")} error={errors.contact_email} />
              <Field label="Contact phone" value={loi.contact_phone} onChange={set("contact_phone")} />
              <div className="sm:col-span-2"><Field label="Purpose of the investment" multiline value={loi.investment_purpose} onChange={set("investment_purpose") as never} /></div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <Checkbox id={`agree-${r.key}`} checked={picked.includes(r.key)} onCheckedChange={(v) => toggle(r.key, v === true)} />
            <Label htmlFor={`agree-${r.key}`}>I have read and agree to this</Label>
          </div>
        </Panel>
      ))}
      <Panel title="Sign">
        <div className="max-w-sm">
          <Field label="Your full name as signature" value={signature} onChange={(e) => setSignature(e.target.value)} error={errors.signature} autoComplete="name" />
        </div>
        <PrimaryButton className="mt-4" onClick={submit} disabled={sign.isPending || picked.length === 0}>
          {sign.isPending ? "Signing…" : picked.length === todo.length ? "Sign all and open the data room" : `Sign ${picked.length} selected`}
        </PrimaryButton>
      </Panel>
    </div>
  );
}
