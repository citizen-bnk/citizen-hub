import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/platform/ui/actions";
import { Field } from "@/platform/ui/kit";
import { type Position, assignPosition, createPosition, updatePosition } from "../api";
import { useMembers, usePositions } from "../hooks";
import { assignSchema, fieldErrors, positionSchema } from "../logic";

const refresh = [["roster"]];

function Frame({ title, description, onClose, onSave, busy, children }: { title: string; description: string; onClose: () => void; onSave: () => void; busy: boolean; children: React.ReactNode }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Create a position, or edit one (null = new). */
export function PositionDialog({ position, onClose }: { position: Position | null; onClose: () => void }) {
  const [form, setForm] = useState({ position_name: position?.position_name ?? "", position_level: String(position?.position_level ?? ""), description: position?.description ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction((v: { position_name: string; position_level: number; description?: string }) => (position ? updatePosition({ id: position.id, ...v }) : createPosition(v)), {
    success: "Position saved", refresh, onDone: onClose, silent: true,
  });
  const submit = () => {
    const p = positionSchema.safeParse(form);
    setErrors(p.success ? {} : fieldErrors(p.error));
    if (p.success) save.mutate(p.data as Parameters<typeof createPosition>[0]);
  };
  return (
    <Frame title={position ? "Edit position" : "New position"} description="Rank 1 is the highest, such as the chairman." onClose={onClose} onSave={submit} busy={save.isPending}>
      <Field label="Name" value={form.position_name} error={errors.position_name} onChange={(e) => setForm({ ...form, position_name: e.target.value })} />
      <Field label="Rank" type="number" value={form.position_level} error={errors.position_level} onChange={(e) => setForm({ ...form, position_level: e.target.value })} />
      <Field label="Description" multiline value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    </Frame>
  );
}

/** Put a member in a position; any position they hold now ends and goes to the history. */
export function AssignDialog({ onClose }: { onClose: () => void }) {
  const members = useMembers();
  const positions = usePositions();
  const [form, setForm] = useState({ member_id: "", position_id: "", term_end_date: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction(assignPosition, { success: "Appointment recorded", refresh, onDone: onClose, silent: true });
  const submit = () => {
    const p = assignSchema.safeParse(form);
    setErrors(p.success ? {} : fieldErrors(p.error));
    if (p.success) save.mutate({ memberId: Number(p.data.member_id), position_id: Number(p.data.position_id), term_end_date: p.data.term_end_date, notes: p.data.notes });
  };
  const pick = (id: string, label: string, key: "member_id" | "position_id", options: { value: string; label: string }[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={form[key]} onValueChange={(v) => setForm({ ...form, [key]: v })}>
        <SelectTrigger id={id}><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      {errors[key] && <p role="alert" className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );
  return (
    <Frame title="Appoint to a position" description="The member's current position, if any, ends today." onClose={onClose} onSave={submit} busy={save.isPending}>
      {pick("member", "Member", "member_id", (members.data ?? []).map((m) => ({ value: String(m.board_member_id), label: `${m.full_name}${m.position_name ? ` (${m.position_name})` : ""}` })))}
      {pick("position", "Position", "position_id", (positions.data ?? []).map((p) => ({ value: String(p.id), label: p.position_name })))}
      <Field label="Term ends" type="date" value={form.term_end_date} error={errors.term_end_date} onChange={(e) => setForm({ ...form, term_end_date: e.target.value })} />
      <Field label="Notes" multiline value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    </Frame>
  );
}
