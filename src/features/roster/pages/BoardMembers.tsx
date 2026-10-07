import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, Status } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import { type Member, syncAccounts } from "../api";
import { useMembers, useUnmapped } from "../hooks";
import { FILTERS, type FilterId, filterMembers, investmentState, needsLink, termDaysLeft, termWords } from "../logic";
import MemberDrawer from "../components/MemberDrawer";
import { AppointDialog } from "../components/MemberDialogs";

/** The board roster: position, term, share requirement and documents per member, with filters and a detail drawer. */
export default function BoardMembers() {
  const q = useMembers();
  const unmapped = useUnmapped();
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [appointing, setAppointing] = useState(false);
  const sync = useAction(syncAccounts, { success: "Accounts synced by email", refresh: [["roster"]] });
  const emails = useMemo(() => new Set((unmapped.data ?? []).map((u) => u.email.toLowerCase())), [unmapped.data]);

  return (
    <main className="mx-auto max-w-6xl">
      <PageHeader
        title="Board members"
        description="Position, term, share requirement and documents for each member."
        actions={
          <>
            <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}><RefreshCw className="mr-1 h-4 w-4" aria-hidden /> Sync accounts</Button>
            <Button onClick={() => setAppointing(true)}><Plus className="mr-1 h-4 w-4" aria-hidden /> Appoint</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input className="max-w-xs" placeholder="Search name, email or position" aria-label="Search members" value={query} onChange={(e) => setQuery(e.target.value)} />
        {FILTERS.map((f) => (
          <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Button>
        ))}
      </div>
      <PageState query={q} empty="No board members yet.">
        {(members) => {
          const rows = filterMembers(members, filter, query, emails);
          if (!rows.length) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No member matches this filter.</p>;
          return (
            <DataTable
              rows={rows}
              rowKey={(m) => m.board_member_id}
              onRow={(m) => setOpenId(m.board_member_id)}
              columns={[
                { key: "n", header: "Member", cell: (m: Member) => (
                  <div>
                    <div className="font-medium">{m.full_name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}{needsLink(m, emails) && " · no account link"}</div>
                  </div>
                ) },
                { key: "p", header: "Position", cell: (m) => m.position_name ?? "None" },
                { key: "t", header: "Term", cell: (m) => <div><div>{date(m.term_end_date)}</div><div className="text-xs text-muted-foreground">{termWords(termDaysLeft(m.term_end_date))}</div></div> },
                { key: "i", header: "Shares", cell: (m) => <SharesCell m={m} />, className: "whitespace-nowrap" },
                { key: "d", header: "Documents", cell: (m) => (m.document_compliance ? `${m.document_compliance.approved} of ${m.document_compliance.total_required}` : "—") },
                { key: "s", header: "Status", cell: (m) => <Status value={m.status === "inactive" ? "pending" : m.status} /> },
              ]}
            />
          );
        }}
      </PageState>
      <MemberDrawer memberId={openId} onClose={() => setOpenId(null)} />
      {appointing && <AppointDialog onClose={() => setAppointing(false)} />}
    </main>
  );
}

function SharesCell({ m }: { m: Member }) {
  const s = investmentState(m);
  if (s === "met") return <Status value="compliant" />;
  if (s === "short") return <span className="text-sm text-destructive">{m.investment_status!.shares_needed} short</span>;
  return <span className="text-muted-foreground">—</span>;
}
