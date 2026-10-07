import { useState } from "react";
import { useSession } from "@/platform/auth/session";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { dateTime } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { DataTable, Drawer, Panel, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { engagement } from "../api";
import { KEY, useDraft, useDrafts } from "../hooks";
import { canApprove, canCancel, canSend, countByStatus, idsFor } from "../logic";
import { EmailFrame } from "./EmailFrame";

const STATUSES = ["", "draft", "approved", "sent", "cancelled"];

/** Review the generated emails: approve the good ones, send them, cancel the rest. */
export function DraftsPanel() {
  const [status, setStatus] = useState("");
  const list = useDrafts(status);
  const { userId } = useSession();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const refresh = [[...KEY.campaigns, "drafts"], [...KEY.campaigns, "stats"], [...KEY.campaigns, "features"]];
  const done = (msg: string) => { setNotice(msg); setSelected(new Set()); };

  const generate = useAction(engagement.generateDrafts, { refresh, onDone: (r) => done(r.message + (r.drafts_failed ? ` (${r.drafts_failed} failed)` : "")) });
  const approve = useAction(engagement.approve, { refresh, onDone: (r) => done(r.message) });
  const send = useAction(engagement.send, { refresh, onDone: (r) => done(r.message + (r.errors?.length ? `. Failed: ${r.errors.map((e) => e.email).join(", ")}` : "")) });
  const cancel = useAction(engagement.cancel, { success: "Draft cancelled", refresh, onDone: () => setOpen(null) });

  const toggle = (id: number) => setSelected((p) => { const n = new Set(p); if (!n.delete(id)) n.add(id); return n; });
  const busy = generate.isPending || approve.isPending || send.isPending;

  return (
    <Panel
      title="Email drafts"
      actions={<Button size="sm" onClick={() => generate.mutate(undefined)} disabled={busy}>{generate.isPending ? "Writing drafts…" : "Generate drafts"}</Button>}
    >
      <PageState query={list} empty="No drafts here. Generate drafts to write the next feature email for each board member.">
        {(rows) => {
          const counts = countByStatus(rows);
          const ids = (a: "approve" | "send") => idsFor(a, rows, selected);
          return (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm" htmlFor="draft-status">Show</label>
                <select id="draft-status" value={status} onChange={(e) => { setStatus(e.target.value); setSelected(new Set()); }} className="h-9 rounded-md border bg-background px-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s || "all"}</option>)}
                </select>
                <span className="text-xs text-muted-foreground">{Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(" · ")}</span>
                <span className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy || !userId || ids("approve").length === 0} onClick={() => userId && approve.mutate({ ids: ids("approve"), userId })}>
                    Approve ({ids("approve").length})
                  </Button>
                  <Button size="sm" disabled={busy || ids("send").length === 0} onClick={() => send.mutate(ids("send"))}>Send ({ids("send").length})</Button>
                </span>
              </div>
              {notice && <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">{notice}</p>}
              <DataTable
                rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpen(r.id)}
                columns={[
                  {
                    key: "c", header: "", className: "w-8",
                    cell: (r) => (
                      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Select ${r.recipient_name}`} disabled={!canApprove(r.status) && !canSend(r.status)} />
                      </span>
                    ),
                  },
                  { key: "r", header: "To", cell: (r) => <div><div className="font-medium">{r.recipient_name}</div><div className="text-xs text-muted-foreground">{r.recipient_email}</div></div> },
                  { key: "s", header: "Subject", cell: (r) => <span className="line-clamp-1">{r.subject_line}</span> },
                  { key: "t", header: "Status", cell: (r) => <Status value={r.status} /> },
                  { key: "d", header: "Created", cell: (r) => dateTime(r.created_at), className: "whitespace-nowrap" },
                ]}
              />
            </div>
          );
        }}
      </PageState>
      <Drawer open={open !== null} onOpenChange={(o) => !o && setOpen(null)} title="Draft email">
        {open !== null && <DraftView id={open} onCancel={(id) => cancel.mutate(id)} busy={cancel.isPending} />}
      </Drawer>
    </Panel>
  );
}

function DraftView({ id, onCancel, busy }: { id: number; onCancel: (id: number) => void; busy: boolean }) {
  const q = useDraft(id);
  return (
    <PageState query={q}>
      {(d) => (
        <>
          <div className="text-sm">
            <div className="font-medium">{d.subject_line}</div>
            <div className="text-muted-foreground">To {d.recipient_name} ({d.recipient_email}) · feature: {d.feature_name}</div>
          </div>
          <EmailFrame html={d.email_html} title={d.subject_line} />
          {canCancel(d.status) && <Button variant="outline" disabled={busy} onClick={() => onCancel(d.id)}>Cancel this draft</Button>}
        </>
      )}
    </PageState>
  );
}
