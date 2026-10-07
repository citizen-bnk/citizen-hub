import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { Field, Panel } from "@/platform/ui/kit";
import { addAgendaItem, type MeetingBundle } from "../api";
import { agendaSchema, nextAgendaNumber } from "../logic";

export default function AgendaTab({ bundle: { meeting, agenda }, canWrite }: { bundle: MeetingBundle; canWrite: boolean }) {
  const [f, setF] = useState({ title: "", duration: "", presenter: "" });
  const [error, setError] = useState<string>();
  const add = useAction(
    () => addAgendaItem(meeting.id, { item_number: nextAgendaNumber(agenda), title: f.title.trim(), duration_minutes: f.duration ? Number(f.duration) : undefined, presenter: f.presenter.trim() || undefined }),
    { success: "Item added", refresh: [["meetings", "one", meeting.id]], onDone: () => setF({ title: "", duration: "", presenter: "" }) },
  );
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = agendaSchema.safeParse(f);
    setError(r.success ? undefined : r.error.issues[0].message);
    if (r.success) add.mutate(undefined);
  };
  return (
    <div className="space-y-4">
      <Panel title="Agenda">
        {agenda.length === 0 ? <p className="text-sm text-muted-foreground">No agenda items yet.</p> : (
          <ol className="divide-y">
            {agenda.map((a) => (
              <li key={a.id} className="flex gap-3 py-2 text-sm">
                <span className="w-6 text-muted-foreground">{a.item_number}.</span>
                <div className="flex-1">
                  <div className="font-medium">{a.title}</div>
                  {a.description && <div className="text-muted-foreground">{a.description}</div>}
                </div>
                <div className="text-right text-xs text-muted-foreground">{a.presenter}{a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}</div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
      {canWrite && (
        <Panel title="Add an item">
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_8rem_10rem_auto] sm:items-end" noValidate>
            <Field label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={error} />
            <Field label="Minutes" inputMode="numeric" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />
            <Field label="Presenter" value={f.presenter} onChange={(e) => setF({ ...f, presenter: e.target.value })} />
            <Button type="submit" disabled={add.isPending}>Add</Button>
          </form>
        </Panel>
      )}
    </div>
  );
}
