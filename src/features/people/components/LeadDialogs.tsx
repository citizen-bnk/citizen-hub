import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Field } from "@/platform/ui/kit";
import { useAction } from "@/platform/ui/actions";
import { label } from "@/platform/format";
import { createLead, importLeads, inviteLeads, type LeadInput, type LeadInvite } from "../api";
import { LEAD_SOURCES, SHARE_CLASSES, inviteLeadSchema, leadSchema, toCsv, validateLeadCsv, type CsvResult } from "../logic";

type Shell = { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode };
const Shell = ({ open, onOpenChange, title, description, children }: Shell) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);
type Props = { open: boolean; onOpenChange: (o: boolean) => void };
const refresh = [["people", "leads"]];
const issues = (e: { issues: { path: (string | number)[]; message: string }[] }) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));

export function AddLead({ open, onOpenChange }: Props) {
  const empty = { full_name: "", email: "", country: "Lesotho", phone: "", company: "", lead_source: "direct", notes: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const add = useAction(createLead, { success: "Lead added", refresh, silent: true, onDone: () => { setF(empty); onOpenChange(false); } });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = leadSchema.safeParse(f);
    setErrors(r.success ? {} : issues(r.error));
    if (r.success) add.mutate(r.data as LeadInput);
  };
  return (
    <Shell open={open} onOpenChange={onOpenChange} title="Add a lead">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Full name" value={f.full_name} onChange={set("full_name")} error={errors.full_name} />
        <Field label="Email" type="email" value={f.email} onChange={set("email")} error={errors.email} />
        <Field label="Country" value={f.country} onChange={set("country")} error={errors.country} />
        <Field label="Phone (optional)" value={f.phone} onChange={set("phone")} />
        <Field label="Company (optional)" value={f.company} onChange={set("company")} />
        <div className="space-y-1.5">
          <Label htmlFor="lead-source">Source</Label>
          <Select value={f.lead_source} onValueChange={(lead_source) => setF((p) => ({ ...p, lead_source }))}>
            <SelectTrigger id="lead-source"><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Field label="Notes (optional)" multiline value={f.notes} onChange={set("notes")} />
        {add.error && <p role="alert" className="text-sm text-destructive">{add.error.message}</p>}
        <Button type="submit" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add lead"}</Button>
      </form>
    </Shell>
  );
}

export function ImportLeads({ open, onOpenChange }: Props) {
  const [parsed, setParsed] = useState<CsvResult | null>(null);
  const [name, setName] = useState("");
  const run = useAction(importLeads, { refresh, onDone: () => { setParsed(null); onOpenChange(false); }, success: "Leads imported" });
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setName(file.name);
    setParsed(validateLeadCsv(await file.text()));
  }
  return (
    <Shell open={open} onOpenChange={onOpenChange} title="Import leads from CSV" description="Required columns: full_name, email, country. Optional: phone, company, lead_source, investment_interest_amount, preferred_share_class, notes.">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="csv-file">CSV file</Label>
          <input id="csv-file" type="file" accept=".csv,text/csv" onChange={pick} className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-card file:px-3 file:py-1.5" />
        </div>
        {parsed?.missingColumns.length ? <p role="alert" className="text-sm text-destructive">{name} is missing the column(s): {parsed.missingColumns.join(", ")}.</p> : null}
        {parsed && !parsed.missingColumns.length && (
          <div className="space-y-2 text-sm">
            <p>{parsed.valid.length} lead(s) ready to import{parsed.errors.length ? `, ${parsed.errors.length} row(s) skipped` : ""}.</p>
            {parsed.errors.length > 0 && (
              <ul className="max-h-32 overflow-y-auto rounded-md border p-2 text-xs text-muted-foreground">
                {parsed.errors.map((e) => <li key={e.row}>Row {e.row}: {e.message}</li>)}
              </ul>
            )}
          </div>
        )}
        <Button disabled={!parsed?.valid.length || run.isPending} onClick={() => parsed && run.mutate(toCsv(parsed.valid))}>
          {run.isPending ? "Importing…" : `Import ${parsed?.valid.length ?? 0} lead(s)`}
        </Button>
        {run.data && run.data.failed > 0 && <p className="text-xs text-muted-foreground">The server skipped {run.data.failed} row(s), such as emails that already exist.</p>}
      </div>
    </Shell>
  );
}

export function InviteLeads({ ids, onClose }: { ids: number[]; onClose: () => void }) {
  const [f, setF] = useState({ share_class: SHARE_CLASSES[0] as string, minimum_investment: "10000", special_terms: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const send = useAction((t: Parameters<typeof inviteLeads>[1]) => inviteLeads(ids, t), { success: "Invitation(s) sent", refresh, onDone: onClose });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = inviteLeadSchema.safeParse(f);
    setErrors(r.success ? {} : issues(r.error));
    if (r.success) send.mutate(r.data as LeadInvite);
  };
  return (
    <Shell open={ids.length > 0} onOpenChange={(o) => !o && onClose()} title={`Invite ${ids.length} lead${ids.length === 1 ? "" : "s"} to invest`} description="They receive an email with a tracked link to subscribe.">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="inv-class">Share class</Label>
          <Select value={f.share_class} onValueChange={(share_class) => setF((p) => ({ ...p, share_class }))}>
            <SelectTrigger id="inv-class"><SelectValue /></SelectTrigger>
            <SelectContent>{SHARE_CLASSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Field label="Minimum investment (LSL)" type="number" min={0} value={f.minimum_investment} onChange={(e) => setF((p) => ({ ...p, minimum_investment: e.target.value }))} error={errors.minimum_investment} />
        <Field label="Special terms (optional)" multiline value={f.special_terms} onChange={(e) => setF((p) => ({ ...p, special_terms: e.target.value }))} />
        <Button type="submit" disabled={send.isPending}>{send.isPending ? "Sending…" : "Send invitation"}</Button>
      </form>
    </Shell>
  );
}
