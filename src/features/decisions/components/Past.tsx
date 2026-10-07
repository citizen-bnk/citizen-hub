import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, Drawer, Panel, Status } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import type { HistoryApproval, HistoryVote, Session } from "../api";
import { useHistory, useSessions } from "../hooks";
import { showResults, typeLabel } from "../logic";
import Results from "./Results";

export default function Past() {
  const sessions = useSessions();
  const history = useHistory();
  const [open, setOpen] = useState<Session | null>(null);
  return (
    <div className="space-y-4">
      <Panel title="Results">
        <PageState query={sessions} isEmpty={(l) => !l.some(showResults)} empty="No decisions have closed yet.">
          {(list) => (
            <ul className="divide-y">
              {list.filter(showResults).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{typeLabel(s.session_type)} · closed {date(s.closes_at)}</div>
                  </div>
                  <Status value={s.status} />
                  <Button size="sm" variant="outline" onClick={() => setOpen(s)}>See result</Button>
                </li>
              ))}
            </ul>
          )}
        </PageState>
      </Panel>
      <PageState query={history}>
        {(h) => (
          <>
            <Panel title="My votes">
              {h.votes.length === 0 ? <p className="text-sm text-muted-foreground">You have not voted yet.</p> : (
                <DataTable<HistoryVote>
                  rows={h.votes} rowKey={(v) => v.id}
                  columns={[
                    { key: "t", header: "Session", cell: (v) => v.title },
                    { key: "v", header: "My vote", cell: (v) => label(v.vote_value) + (v.voted_on_behalf_of ? " (as proxy)" : "") },
                    { key: "d", header: "Date", cell: (v) => date(v.voted_at), className: "hidden sm:table-cell" },
                  ]}
                />
              )}
            </Panel>
            <Panel title="My approvals">
              {h.approvals.length === 0 ? <p className="text-sm text-muted-foreground">You have not approved any documents.</p> : (
                <DataTable<HistoryApproval>
                  rows={h.approvals} rowKey={(a) => a.id}
                  columns={[
                    { key: "t", header: "Document", cell: (a) => a.file_name ?? a.title ?? label(a.approval_type) },
                    { key: "s", header: "Answer", cell: (a) => <Status value={a.status} /> },
                    { key: "d", header: "Date", cell: (a) => date(a.approved_at), className: "hidden sm:table-cell" },
                  ]}
                />
              )}
            </Panel>
          </>
        )}
      </PageState>
      {open && <Drawer open onOpenChange={(o) => !o && setOpen(null)} title={open.title} description={typeLabel(open.session_type)}><Results sessionId={open.id} /></Drawer>}
    </div>
  );
}
