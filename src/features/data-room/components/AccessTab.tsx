import { useState } from "react";
import { DataTable, Panel } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { dateTime } from "@/platform/format";
import { useAccessLogs, useDocumentStats } from "../hooks";
import { shortId } from "../logic";

/** Who opened which document, and how often each document is opened. */
export default function AccessTab() {
  const logs = useAccessLogs();
  const stats = useDocumentStats();
  const [doc, setDoc] = useState("");

  return (
    <div className="space-y-6">
      <Panel title="Most opened documents">
        <PageState query={stats} isEmpty={(s) => s.stats.length === 0} empty="No documents yet.">
          {({ stats: rows }) => (
            <DataTable
              rows={rows}
              rowKey={(s) => s.document_id}
              columns={[
                { key: "n", header: "Document", cell: (s) => <div><div className="font-medium">{s.document_name}</div><div className="text-xs text-muted-foreground">{s.category_name ?? "No category"}</div></div> },
                { key: "t", header: "Opened", cell: (s) => s.total_accesses },
                { key: "u", header: "People", cell: (s) => s.unique_users },
                { key: "l", header: "Last opened", cell: (s) => dateTime(s.last_accessed) },
              ]}
            />
          )}
        </PageState>
      </Panel>

      <Panel
        title="Access log"
        actions={
          <select aria-label="Filter by document" className="h-9 rounded-md border bg-background px-2 text-sm" value={doc} onChange={(e) => setDoc(e.target.value)}>
            <option value="">All documents</option>
            {stats.data?.stats.map((s) => <option key={s.document_id} value={s.document_id}>{s.document_name}</option>)}
          </select>
        }
      >
        <PageState query={logs} isEmpty={(l) => l.logs.length === 0} empty="Nobody has opened a document yet.">
          {({ logs: rows }) => (
            <DataTable
              rows={rows.filter((l) => !doc || String(l.document_id) === doc)}
              rowKey={(l) => l.id}
              columns={[
                { key: "w", header: "When", cell: (l) => dateTime(l.accessed_at) },
                { key: "u", header: "Person", cell: (l) => <span title={l.user_id}>{shortId(l.user_id)}</span> },
                { key: "d", header: "Document", cell: (l) => l.document_name },
                { key: "r", header: "Reason", cell: (l) => l.access_reason ?? "—" },
                { key: "ip", header: "Address", cell: (l) => l.ip_address ?? "—" },
              ]}
            />
          )}
        </PageState>
      </Panel>
    </div>
  );
}
