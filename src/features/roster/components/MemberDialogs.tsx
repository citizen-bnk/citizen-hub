import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/platform/ui/actions";
import { Field } from "@/platform/ui/kit";
import { type AvailableUser, type Member, appoint, linkAccount, updateMember } from "../api";
import { useAvailableUsers, usePositions } from "../hooks";
import { APPOINT_POSITIONS, appointSchema, editSchema, fieldErrors } from "../logic";

const refresh = [["roster"]];

function Shell({ title, description, onClose, onSave, busy, children }: { title: string; description: string; onClose: () => void; onSave: () => void; busy: boolean; children: React.ReactNode }) {
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

function Choose({ id, label, value, onChange, options, error, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const userOptions = (users: AvailableUser[] | undefined) => (users ?? []).map((u) => ({ value: u.user_id, label: `${u.full_name} (${u.email})` }));

/** Appoint a registered person to the board. */
export function AppointDialog({ onClose }: { onClose: () => void }) {
  const users = useAvailableUsers(true);
  const [form, setForm] = useState({ user_id: "", position: "", term_years: "3" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction(appoint, { success: "Board member appointed", refresh, onDone: onClose, silent: true });
  const submit = () => {
    const p = appointSchema.safeParse(form);
    setErrors(p.success ? {} : fieldErrors(p.error));
    if (p.success) save.mutate(p.data as Parameters<typeof appoint>[0]);
  };
  const serverError = save.error?.message;
  return (
    <Shell title="Appoint a board member" description="Choose a registered person and the position they will hold." onClose={onClose} onSave={submit} busy={save.isPending}>
      <Choose id="user" label="Person" placeholder="Choose a person" value={form.user_id} onChange={(v) => setForm({ ...form, user_id: v })} options={userOptions(users.data)} error={errors.user_id} />
      <Choose id="position" label="Position" placeholder="Choose a position" value={form.position} onChange={(v) => setForm({ ...form, position: v })} options={[...APPOINT_POSITIONS]} error={errors.position} />
      <Field label="Term (years)" type="number" value={form.term_years} error={errors.term_years} onChange={(e) => setForm({ ...form, term_years: e.target.value })} />
      {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
    </Shell>
  );
}

/** Change position, term end or status. */
export function EditDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const positions = usePositions();
  const [form, setForm] = useState({ position: member.position_name ?? "", term_end_date: member.term_end_date?.slice(0, 10) ?? "", status: member.status ?? "active" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction(updateMember, { success: "Member updated", refresh, onDone: onClose, silent: true });
  const submit = () => {
    const p = editSchema.safeParse(form);
    setErrors(p.success ? {} : fieldErrors(p.error));
    if (p.success && member.user_id) save.mutate({ userId: member.user_id, ...p.data });
  };
  return (
    <Shell title={`Edit ${member.full_name}`} description="Changing the position ends the current one and records it in the history." onClose={onClose} onSave={submit} busy={save.isPending}>
      <Choose id="pos" label="Position" value={form.position} onChange={(v) => setForm({ ...form, position: v })} options={(positions.data ?? []).map((p) => ({ value: p.position_name, label: p.position_name }))} />
      <Field label="Term ends" type="date" value={form.term_end_date} error={errors.term_end_date} onChange={(e) => setForm({ ...form, term_end_date: e.target.value })} />
      <Choose id="status" label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["active", "inactive", "resigned"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    </Shell>
  );
}

/** Link a member record to the registered account that should sign in as them. */
export function LinkDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const users = useAvailableUsers(true);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const save = useAction(linkAccount, { success: "Account linked", refresh, onDone: onClose });
  return (
    <Shell title={`Link ${member.full_name}`} description="Pick the account this person signs in with." onClose={onClose} busy={save.isPending}
      onSave={() => (userId ? save.mutate({ board_member_id: member.board_member_id, user_id: userId }) : setError("Choose an account"))}>
      <Choose id="acct" label="Account" placeholder="Choose an account" value={userId} onChange={setUserId} options={userOptions(users.data)} error={error} />
    </Shell>
  );
}
