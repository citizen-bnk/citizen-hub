import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Field, Panel } from "@/platform/ui/kit";
import { useAction } from "@/platform/ui/actions";
import { label } from "@/platform/format";
import { createInvitation } from "../api";
import { POSITIONS, inviteBody, inviteSchema, type InvitableRole } from "../logic";

type Form = { full_name: string; email: string; role: string; position: string; message: string; expires_at: string };
const EMPTY: Form = { full_name: "", email: "", role: "", position: "", message: "", expires_at: "" };

/** Invite one person. `roles` are the roles the signed-in person may invite. */
export function InviteForm({ roles }: { roles: InvitableRole[] }) {
  const [f, setF] = useState<Form>({ ...EMPTY, role: roles.length === 1 ? roles[0] : "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const send = useAction(createInvitation, {
    success: "Invitation sent", refresh: [["people", "invitations"]], silent: true,
    onDone: () => setF({ ...EMPTY, role: roles.length === 1 ? roles[0] : "" }),
  });
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const serverError = send.error?.message;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = inviteSchema.safeParse(f);
    setErrors(parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
    if (parsed.success) send.mutate(inviteBody(parsed.data));
  }

  return (
    <Panel title="Invite someone">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full name" value={f.full_name} onChange={set("full_name")} error={errors.full_name} />
        <Field label="Email" type="email" value={f.email} onChange={set("email")} error={errors.email} />
        <div className="space-y-1.5">
          <Label htmlFor="inv-role">Role</Label>
          <Select value={f.role} onValueChange={(role) => setF((p) => ({ ...p, role }))}>
            <SelectTrigger id="inv-role" aria-invalid={!!errors.role}><SelectValue placeholder="Choose a role" /></SelectTrigger>
            <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{label(r)}</SelectItem>)}</SelectContent>
          </Select>
          {errors.role && <p role="alert" className="text-xs text-destructive">{errors.role}</p>}
        </div>
        {f.role === "board_member" && (
          <div className="space-y-1.5">
            <Label htmlFor="inv-position">Position</Label>
            <Select value={f.position} onValueChange={(position) => setF((p) => ({ ...p, position }))}>
              <SelectTrigger id="inv-position"><SelectValue placeholder="Choose a position" /></SelectTrigger>
              <SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{label(p)}</SelectItem>)}</SelectContent>
            </Select>
            {errors.position && <p role="alert" className="text-xs text-destructive">{errors.position}</p>}
          </div>
        )}
        <Field label="Expires on (optional)" type="date" value={f.expires_at} onChange={set("expires_at")} hint="Seven days from now when left empty" />
        <div className="sm:col-span-2"><Field label="Message (optional)" multiline value={f.message} onChange={set("message")} /></div>
        {serverError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{serverError}</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={send.isPending}>{send.isPending ? "Sending…" : "Send invitation"}</Button></div>
      </form>
    </Panel>
  );
}

