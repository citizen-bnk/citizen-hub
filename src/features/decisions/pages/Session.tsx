import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { Confirm, PageHeader, Panel, Status } from "@/platform/ui/kit";
import { dateTime } from "@/platform/format";
import { deleteSession, setSessionStatus, type SessionDetails, updateSession } from "../api";
import DocsPanel from "../components/DocsPanel";
import ItemsPanel from "../components/ItemsPanel";
import NotifyDrawer from "../components/NotifyDrawer";
import Results from "../components/Results";
import SessionFields from "../components/SessionFields";
import { useSession } from "../hooks";
import { canEdit, checkSession, formFromSession, showResults, STATUS_STEPS, typeLabel } from "../logic";

export default function Session() {
  const { sessionId = "" } = useParams();
  const q = useSession(sessionId);
  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/office/decisions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden /> All sessions</Link>
      <PageState query={q}>{(d) => <Body d={d} />}</PageState>
    </div>
  );
}

function Body({ d }: { d: SessionDetails }) {
  const s = d.session;
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => formFromSession(s));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<(typeof STATUS_STEPS)["draft"][number] | null>(null);
  const [removing, setRemoving] = useState(false);
  const [notify, setNotify] = useState(false);
  const refresh = [["decisions"]];
  const save = useAction((v: Parameters<typeof updateSession>[1]) => updateSession(s.id, v), { success: "Session updated", refresh, onDone: () => setEditing(false) });
  const move = useAction((to: Parameters<typeof setSessionStatus>[1]) => setSessionStatus(s.id, to), { success: "Status changed", refresh, onDone: () => setStep(null) });
  const remove = useAction(() => deleteSession(s.id), { success: "Session deleted", refresh, onDone: () => nav("/office/decisions") });

  return (
    <div className="space-y-4">
      <PageHeader
        title={s.title}
        description={`${typeLabel(s.session_type)}${s.closes_at ? ` · closes ${dateTime(s.closes_at)}` : s.meeting_date ? ` · ${dateTime(s.meeting_date)}` : ""}`}
        actions={<Status value={s.status} />}
      />
      <div className="flex flex-wrap gap-2">
        {STATUS_STEPS[s.status].map((x) => <Button key={x.to} onClick={() => setStep(x)}>{x.label}</Button>)}
        {canEdit(s) && <Button variant="outline" onClick={() => { setForm(formFromSession(s)); setEditing(true); }}>Edit details</Button>}
        <Button variant="outline" onClick={() => setNotify(true)}>Notify members</Button>
        {s.status === "draft" && <Button variant="outline" onClick={() => setRemoving(true)}>Delete</Button>}
      </div>

      {editing ? (
        <Panel title="Edit details">
          <SessionFields form={form} set={(p) => setForm((f) => ({ ...f, ...p }))} errors={errors} lockType />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button disabled={save.isPending} onClick={() => {
              const c = checkSession(form);
              setErrors(c.ok ? {} : c.errors);
              if (c.ok) save.mutate(c.value);
            }}>Save changes</Button>
          </div>
        </Panel>
      ) : s.description && <Panel><p className="whitespace-pre-wrap text-sm">{s.description}</p></Panel>}

      {s.session_type === "agm_vote" && <ItemsPanel session={s} items={d.items} />}
      <DocsPanel session={s} docs={d.documents} />
      {showResults(s) && <Panel title="Results"><Results sessionId={s.id} /></Panel>}

      <Confirm open={!!step} onOpenChange={(o) => !o && setStep(null)} title={step?.label ?? ""} description={step?.confirm} confirmLabel={step?.label} busy={move.isPending} onConfirm={() => step && move.mutate(step.to)} />
      <Confirm open={removing} onOpenChange={setRemoving} title="Delete this session?" description="The session, its questions and documents are removed for good." confirmLabel="Delete" destructive busy={remove.isPending} onConfirm={() => remove.mutate(undefined)} />
      {notify && <NotifyDrawer sessionId={s.id} onClose={() => setNotify(false)} />}
    </div>
  );
}
