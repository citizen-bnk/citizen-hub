import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { Field, Panel, Status } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import { type ActionItem, createActionItem, type MeetingBundle, type Priority, updateActionItem } from "../api";
import { actionSchema, isOverdue, NEXT_ACTION_STATUS } from "../logic";
import { Select } from "./Select";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export default function ActionsTab({ bundle: { meeting, actions, invitees } }: { bundle: MeetingBundle }) {
  const refresh = [["meetings", "one", meeting.id]];
  const empty = { title: "", assigned_to: "", due_date: "", priority: "medium" as Priority };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useAction(() => createActionItem(meeting.id, { title: f.title.trim(), assigned_to: f.assigned_to, due_date: f.due_date || undefined, priority: f.priority }), { success: "Action added", refresh, onDone: () => setF(empty) });
  const step = useAction((v: { id: string; to: ActionItem["status"] }) => updateActionItem(v.id, { status: v.to }), { success: "Action updated", refresh });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = actionSchema.safeParse(f);
    const errs: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
    setErrors(errs);
    if (r.success) create.mutate(undefined);
  };
  const who = (id: string) => invitees.find((i) => i.board_member_id === id)?.email ?? "Unknown";

  return (
    <div className="space-y-4">
      <Panel title="Action items">
        {actions.length === 0 ? <p className="text-sm text-muted-foreground">Nothing has been assigned from this meeting.</p> : (
          <ul className="divide-y">
            {actions.map((a) => {
              const next = NEXT_ACTION_STATUS[a.status];
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{who(a.assigned_to)} · {label(a.priority)} priority{a.due_date && ` · due ${date(a.due_date)}`}{isOverdue(a) && <span className="text-destructive"> · overdue</span>}</div>
                  </div>
                  <Status value={a.status} />
                  {next && <Button size="sm" variant="outline" disabled={step.isPending} onClick={() => step.mutate({ id: a.id, to: next.to })}>{next.label}</Button>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel title="Add an action">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2"><Field label="What needs doing" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} /></div>
          <Select label="Assigned to" value={f.assigned_to} onChange={(v) => setF({ ...f, assigned_to: v })} error={errors.assigned_to}
            options={[{ value: "", label: "Choose…" }, ...invitees.map((i) => ({ value: i.board_member_id, label: i.email }))]} />
          <Select label="Priority" value={f.priority} onChange={(v) => setF({ ...f, priority: v as Priority })} options={PRIORITIES.map((p) => ({ value: p, label: label(p) }))} />
          <Field label="Due date" type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
          <div className="flex items-end justify-end"><Button type="submit" disabled={create.isPending}>Add action</Button></div>
        </form>
      </Panel>
    </div>
  );
}
