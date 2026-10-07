import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { Confirm, Panel } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import { cancelMeeting, type MeetingBundle, updateMeeting } from "../api";
import { checkMeeting, formFromMeeting, isOpen, shortTime, type MeetingForm } from "../logic";
import MeetingFields from "./MeetingFields";

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[7rem_1fr] gap-2 py-1.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd>{children}</dd></div>
);

export default function OverviewTab({ bundle: { meeting: m }, canWrite }: { bundle: MeetingBundle; canWrite: boolean }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [form, setForm] = useState<MeetingForm>(() => formFromMeeting(m));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction((v: Parameters<typeof updateMeeting>[1]) => updateMeeting(m.id, v), { success: "Meeting updated", refresh: [["meetings"]], onDone: () => setEditing(false) });
  const cancel = useAction(() => cancelMeeting(m.id), { success: "Meeting cancelled", refresh: [["meetings"]], onDone: () => setConfirm(false) });
  const done = useAction(() => updateMeeting(m.id, { status: "completed" }), { success: "Marked as held", refresh: [["meetings"]] });

  if (editing) {
    return (
      <Panel title="Edit meeting">
        <MeetingFields form={form} set={(p) => setForm((f) => ({ ...f, ...p }))} errors={errors} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          <Button disabled={save.isPending} onClick={() => {
            const c = checkMeeting(form);
            setErrors(c.ok ? {} : c.errors);
            if (c.ok) save.mutate(c.value);
          }}>Save changes</Button>
        </div>
      </Panel>
    );
  }
  return (
    <Panel
      actions={canWrite && isOpen(m) && (
        <div className="flex gap-2">
          {m.status === "scheduled" && <Button variant="outline" size="sm" disabled={done.isPending} onClick={() => done.mutate(undefined)}>Mark as held</Button>}
          <Button variant="outline" size="sm" onClick={() => { setForm(formFromMeeting(m)); setEditing(true); }}>Edit</Button>
          <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>Cancel meeting</Button>
        </div>
      )}
    >
      <dl>
        <Row k="When">{date(m.meeting_date)}, {shortTime(m.meeting_time)}</Row>
        <Row k="Type">{label(m.meeting_type)}</Row>
        <Row k="Where">{m.location || "—"}</Row>
        <Row k="Video link">{m.virtual_link ? <a href={m.virtual_link} target="_blank" rel="noreferrer" className="text-primary underline">Join online</a> : "—"}</Row>
        {m.description && <Row k="About"><span className="whitespace-pre-wrap">{m.description}</span></Row>}
      </dl>
      <Confirm open={confirm} onOpenChange={setConfirm} title="Cancel this meeting?" description="Members keep the record, but the meeting is marked as cancelled." confirmLabel="Cancel meeting" destructive busy={cancel.isPending} onConfirm={() => cancel.mutate(undefined)} />
    </Panel>
  );
}
