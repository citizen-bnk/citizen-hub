import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { Field, PageHeader, Panel } from "@/platform/ui/kit";
import { addAgendaItem, createMeeting, inviteMembers } from "../api";
import MeetingFields from "../components/MeetingFields";
import { useBoardMembers } from "../hooks";
import { agendaSchema, checkMeeting, emptyMeetingForm, type MeetingForm } from "../logic";

type Agenda = { title: string; duration: string };

/** One form: the meeting, who is invited and an optional agenda. */
export default function NewMeeting() {
  const nav = useNavigate();
  const [form, setForm] = useState<MeetingForm>(emptyMeetingForm);
  const [invited, setInvited] = useState<string[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const members = useBoardMembers();

  const save = useAction(
    async (v: { meeting: Extract<ReturnType<typeof checkMeeting>, { ok: true }>["value"]; invited: string[]; agenda: Agenda[] }) => {
      const m = await createMeeting(v.meeting);
      // The meeting now exists: add the agenda, then invite (which sends the emails).
      for (const [i, a] of v.agenda.entries()) await addAgendaItem(m.id, { item_number: i + 1, title: a.title, duration_minutes: a.duration ? Number(a.duration) : undefined });
      if (v.invited.length) await inviteMembers(m.id, v.invited);
      return m;
    },
    { success: "Meeting scheduled", refresh: [["meetings"]], onDone: (m) => nav(`/meetings/${m.id}`) },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const checked = checkMeeting(form);
    const items = agenda.filter((a) => a.title.trim());
    const bad = items.find((a) => !agendaSchema.safeParse(a).success);
    setErrors(checked.ok ? (bad ? { agenda: "Agenda durations are minutes, as numbers" } : {}) : checked.errors);
    if (checked.ok && !bad) save.mutate({ meeting: checked.value, invited, agenda: items });
  };
  const toggle = (id: string) => setInvited((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5" noValidate>
      <PageHeader title="New meeting" description="Schedule the meeting, choose who to invite and, if you like, outline the agenda." />
      <Panel title="Details"><MeetingFields form={form} set={(p) => setForm((f) => ({ ...f, ...p }))} errors={errors} /></Panel>

      <Panel title="Invitees" >
        <PageState query={members} empty="No active board members found.">
          {(list) => (
            <ul className="space-y-2">
              {list.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <Checkbox id={`inv-${m.user_id}`} checked={invited.includes(m.user_id)} onCheckedChange={() => toggle(m.user_id)} />
                  <label htmlFor={`inv-${m.user_id}`} className="text-sm">{m.full_name} <span className="text-muted-foreground">{m.position ?? m.email}</span></label>
                </li>
              ))}
            </ul>
          )}
        </PageState>
        <p className="mt-2 text-xs text-muted-foreground">Invited members get an email with the details.</p>
      </Panel>

      <Panel title="Agenda (optional)" actions={<Button type="button" variant="outline" size="sm" onClick={() => setAgenda((a) => [...a, { title: "", duration: "" }])}>Add item</Button>}>
        {agenda.length === 0 && <p className="text-sm text-muted-foreground">No items yet. You can also add them later.</p>}
        <div className="space-y-3">
          {agenda.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
              <Field label={`Item ${i + 1}`} value={a.title} onChange={(e) => setAgenda((l) => l.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <Field label="Minutes" inputMode="numeric" value={a.duration} onChange={(e) => setAgenda((l) => l.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)))} />
              <Button type="button" variant="ghost" size="sm" onClick={() => setAgenda((l) => l.filter((_, j) => j !== i))}>Remove</Button>
            </div>
          ))}
        </div>
        {errors.agenda && <p role="alert" className="mt-2 text-xs text-destructive">{errors.agenda}</p>}
      </Panel>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => nav("/meetings")}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Scheduling…" : "Schedule meeting"}</Button>
      </div>
    </form>
  );
}
