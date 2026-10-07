import { useState } from "react";
import { Button } from "@/components/ui/button";
import { dateTime, number } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { DataTable, Drawer, Panel, Stat, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { mail, type SentEmail } from "../api";
import { KEY, useQueue, useSent } from "../hooks";
import { canRetry } from "../logic";
import { EmailFrame } from "./EmailFrame";

const STATUSES = ["", "pending", "retrying", "sent", "failed"];

/** Every email the system sent or tried to send, with a retry for the ones that failed. */
export function OutboxTab() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<SentEmail | null>(null);
  const queue = useQueue();
  const list = useSent(status, search);
  const retry = useAction(mail.retry, { success: "Queued for another try", refresh: [KEY.outbox] });

  return (
    <div className="space-y-4">
      <PageState query={queue}>
        {({ queue_stats: q }) => (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Waiting" value={number(q.pending + q.retrying)} hint="Last 7 days" />
            <Stat label="Sent" value={number(q.sent)} />
            <Stat label="Failed" value={number(q.failed)} />
            <Stat label="Total" value={number(q.total)} />
          </div>
        )}
      </PageState>
      <Panel title="Sent and failed emails">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s || "all statuses"}</option>)}
          </select>
          <input
            type="search" aria-label="Search recipient or subject" placeholder="Search recipient or subject" value={search}
            onChange={(e) => setSearch(e.target.value)} className="h-9 min-w-48 flex-1 rounded-md border bg-background px-3 text-sm"
          />
        </div>
        <PageState query={list} empty="No emails match.">
          {({ emails }) => (
            <DataTable
              rows={emails} rowKey={(r) => r.queue_id} onRow={(r) => setOpen(r)}
              columns={[
                { key: "r", header: "To", cell: (r) => <div><div className="font-medium">{r.recipient_name}</div><div className="text-xs text-muted-foreground">{r.recipient_email}</div></div> },
                { key: "s", header: "Subject", cell: (r) => <span className="line-clamp-1">{r.subject}</span> },
                { key: "t", header: "Status", cell: (r) => <Status value={r.status} /> },
                { key: "d", header: "When", cell: (r) => dateTime(r.sent_at ?? r.created_at), className: "whitespace-nowrap" },
                {
                  key: "a", header: "", className: "text-right",
                  cell: (r) => canRetry(r.status) && (
                    <Button size="sm" variant="outline" disabled={retry.isPending} onClick={(e) => { e.stopPropagation(); retry.mutate(r.queue_id); }}>Retry</Button>
                  ),
                },
              ]}
            />
          )}
        </PageState>
      </Panel>
      <Drawer open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.subject ?? "Email"} description={open ? `To ${open.recipient_email}` : undefined}>
        {open && (
          <>
            <div className="flex items-center gap-2 text-sm"><Status value={open.status} />{open.template_name && <span className="text-muted-foreground">{open.template_name}</span>}{open.retry_count > 0 && <span className="text-muted-foreground">· {open.retry_count} retries</span>}</div>
            {open.last_error && <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{open.last_error}</p>}
            <EmailFrame html={open.body_html} title={open.subject} />
            {canRetry(open.status) && <Button disabled={retry.isPending} onClick={() => retry.mutate(open.queue_id, { onSuccess: () => setOpen(null) })}>Retry</Button>}
          </>
        )}
      </Drawer>
    </div>
  );
}
