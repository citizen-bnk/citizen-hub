import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Confirm, DataTable, Field, Panel } from "@/platform/ui/kit";
import { label } from "@/platform/format";
import { type Requirement, removeRequirement, saveRequirement } from "../api";
import { useRequirements, useSettings } from "../hooks";
import { JURISDICTIONS, type RequirementForm, SEVERITIES, fieldErrors, requirementSchema } from "../logic";

const blank: RequirementForm = { name: "", description: "", jurisdictions: ["global"], is_required: true, requires_template: false, validity_period_days: "", display_order: 0, default_severity: "normal" };

/** The one place to define what members must supply: the document, who it applies to, how often it expires, how urgent it is. */
export default function RequirementsEditor() {
  const reqs = useRequirements();
  const settings = useSettings();
  const severity = (id: number) => settings.data?.find((s) => s.requirement_id === id)?.default_severity ?? "normal";
  const [editing, setEditing] = useState<{ id?: number; form: RequirementForm; hasTemplate: boolean } | null>(null);
  const [removing, setRemoving] = useState<Requirement | null>(null);
  const remove = useAction(removeRequirement, { success: "Requirement removed", refresh: [["compliance"]], onDone: () => setRemoving(null) });

  const open = (r?: Requirement) =>
    setEditing(r
      ? { id: r.id, hasTemplate: !!r.template_file_name, form: { name: r.name, description: r.description ?? "", jurisdictions: r.jurisdictions as RequirementForm["jurisdictions"], is_required: r.is_required, requires_template: r.requires_template, validity_period_days: r.validity_period_days ?? "", display_order: r.display_order, default_severity: severity(r.id) as RequirementForm["default_severity"] } }
      : { form: blank, hasTemplate: false });

  return (
    <Panel actions={<Button size="sm" onClick={() => open()}><Plus className="mr-1 h-4 w-4" aria-hidden /> Add requirement</Button>}>
      <PageState query={reqs} empty="No requirements defined yet.">
        {(rows) => (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRow={open}
            columns={[
              { key: "n", header: "Document", cell: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.description}</div></div> },
              { key: "j", header: "Applies to", cell: (r) => r.jurisdictions.map(label).join(", ") },
              { key: "r", header: "Required", cell: (r) => (r.is_required ? "Yes" : "Optional") },
              { key: "v", header: "Valid for", cell: (r) => (r.validity_period_days ? `${r.validity_period_days} days` : "No expiry") },
              { key: "t", header: "Template", cell: (r) => r.template_file_name ?? "None" },
              { key: "a", header: "", className: "text-right", cell: (r) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setRemoving(r); }}>Remove</Button> },
            ]}
          />
        )}
      </PageState>
      {editing && <EditDialog key={editing.id ?? "new"} initial={editing} onClose={() => setEditing(null)} />}
      <Confirm
        open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} destructive confirmLabel="Remove" busy={remove.isPending}
        title={`Remove ${removing?.name ?? "requirement"}?`}
        description="Members will no longer be asked for it. Documents already submitted are kept."
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </Panel>
  );
}

function EditDialog({ initial, onClose }: { initial: { id?: number; form: RequirementForm; hasTemplate: boolean }; onClose: () => void }) {
  const [form, setForm] = useState(initial.form);
  const [template, setTemplate] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction(saveRequirement, { success: "Requirement saved", refresh: [["compliance"]], onDone: onClose });
  const set = <K extends keyof RequirementForm>(k: K, v: RequirementForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const parsed = requirementSchema.safeParse(form);
    setErrors(parsed.success ? {} : fieldErrors(parsed.error));
    if (!parsed.success) return;
    const { default_severity, ...body } = parsed.data;
    save.mutate({ id: initial.id, body: { ...body, description: body.description || null }, severity: default_severity, template });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Edit requirement" : "New requirement"}</DialogTitle>
          <DialogDescription>Members are asked for this document in their compliance list.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name" value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
          <Field label="Description" multiline value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Applies to</legend>
            <div className="flex flex-wrap gap-4">
              {JURISDICTIONS.map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <Checkbox id={`j-${j}`} checked={form.jurisdictions.includes(j)} onCheckedChange={(c) => set("jurisdictions", c ? [...form.jurisdictions, j] : form.jurisdictions.filter((x) => x !== j))} />
                  <Label htmlFor={`j-${j}`}>{label(j)}</Label>
                </div>
              ))}
            </div>
            {errors.jurisdictions && <p role="alert" className="text-xs text-destructive">{errors.jurisdictions}</p>}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid for (days)" type="number" hint="Blank: never expires" value={String(form.validity_period_days ?? "")} error={errors.validity_period_days} onChange={(e) => set("validity_period_days", e.target.value)} />
            <Field label="Order" type="number" value={String(form.display_order ?? 0)} error={errors.display_order} onChange={(e) => set("display_order", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="severity">How urgent</Label>
            <Select value={form.default_severity} onValueChange={(v) => set("default_severity", v as RequirementForm["default_severity"])}>
              <SelectTrigger id="severity"><SelectValue /></SelectTrigger>
              <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="required" checked={form.is_required} onCheckedChange={(c) => set("is_required", c === true)} />
            <Label htmlFor="required">Every member must supply it</Label>
          </div>
          <Field label={initial.hasTemplate ? "Replace template" : "Template to download"} type="file" onChange={(e) => setTemplate(e.target.files?.[0] ?? null)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
