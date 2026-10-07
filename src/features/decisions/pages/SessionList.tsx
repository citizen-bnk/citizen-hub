import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { DataTable, Drawer, PageHeader, Status } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import { createSession, type Session } from "../api";
import SessionFields from "../components/SessionFields";
import { useSessions } from "../hooks";
import { checkSession, emptySessionForm, typeLabel } from "../logic";

const FILTERS = ["all", "draft", "active", "closed", "finalized"];

export default function SessionList() {
  const nav = useNavigate();
  const q = useSessions();
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptySessionForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useAction((v: Parameters<typeof createSession>[0]) => createSession(v), {
    success: "Session created", refresh: [["decisions"]], onDone: (r) => nav(`/office/decisions/${r.session_id}`),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Governance sessions" description="Votes and resolutions for the board and shareholders." actions={<Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" aria-hidden /> New session</Button>} />
      <Tabs value={filter} onValueChange={setFilter} className="mb-4 overflow-x-auto">
        <TabsList>{FILTERS.map((f) => <TabsTrigger key={f} value={f}>{label(f)}</TabsTrigger>)}</TabsList>
      </Tabs>
      <PageState query={q} empty="No sessions yet. Create the first one.">
        {(all) => {
          const rows = filter === "all" ? all : all.filter((s) => s.status === filter);
          return rows.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No {filter} sessions.</p> : (
            <DataTable<Session>
              rows={rows} rowKey={(s) => s.id} onRow={(s) => nav(`/office/decisions/${s.id}`)}
              columns={[
                { key: "t", header: "Session", cell: (s) => <span className="font-medium">{s.title}</span> },
                { key: "k", header: "Kind", cell: (s) => typeLabel(s.session_type), className: "hidden sm:table-cell" },
                { key: "c", header: "Closes", cell: (s) => date(s.closes_at ?? s.meeting_date), className: "hidden md:table-cell" },
                { key: "s", header: "Status", cell: (s) => <Status value={s.status} /> },
              ]}
            />
          );
        }}
      </PageState>
      <Drawer open={creating} onOpenChange={setCreating} title="New session" description="It starts as a draft. Add the questions and documents, then open it.">
        <SessionFields form={form} set={(p) => setForm((f) => ({ ...f, ...p }))} errors={errors} />
        <Button disabled={create.isPending} onClick={() => {
          const c = checkSession(form);
          setErrors(c.ok ? {} : c.errors);
          if (c.ok) create.mutate(c.value);
        }}>Create session</Button>
      </Drawer>
    </div>
  );
}
