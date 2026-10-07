import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Stat, DataTable, Status, type Column } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { date, label, number } from "@/platform/format";
import { leadAnalytics, listLeads, type Lead } from "../api";
import { AddLead, ImportLeads, InviteLeads } from "../components/LeadDialogs";
import { LEAD_STATUSES, canInviteLead, pipeline } from "../logic";

export default function Leads() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [inviting, setInviting] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const stats = useQuery({ queryKey: ["people", "leads", "analytics"], queryFn: leadAnalytics });
  const leads = useQuery({
    queryKey: ["people", "leads", status, search],
    queryFn: () => listLeads({ status: status === "all" ? undefined : status, search: search.trim() || undefined }),
  });
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const columns: Column<Lead>[] = [
    { key: "pick", header: "", className: "w-8", cell: (l) => canInviteLead(l.status) && <Checkbox aria-label={`Select ${l.full_name}`} checked={selected.includes(l.id)} onCheckedChange={() => toggle(l.id)} /> },
    { key: "who", header: "Lead", cell: (l) => <div><div className="font-medium">{l.full_name}</div><div className="text-xs text-muted-foreground">{l.email}</div></div> },
    { key: "country", header: "Country", className: "hidden sm:table-cell", cell: (l) => l.country },
    { key: "source", header: "Source", className: "hidden md:table-cell", cell: (l) => label(l.lead_source) },
    { key: "status", header: "Status", cell: (l) => <Status value={l.status} /> },
    { key: "inv", header: "Invites", className: "hidden lg:table-cell", cell: (l) => number(l.invitation_count) },
    { key: "added", header: "Added", className: "hidden lg:table-cell", cell: (l) => date(l.created_at) },
    { key: "act", header: "", cell: (l) => canInviteLead(l.status) && <Button size="sm" variant="outline" onClick={() => setInviting([l.id])}>Invite</Button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investor leads" description="Prospective investors, and who has been invited into the Hub."
        actions={<>
          <Button variant="outline" onClick={() => setImporting(true)}><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
          <Button onClick={() => setAdding(true)}><Plus className="mr-2 h-4 w-4" />Add lead</Button>
        </>}
      />

      <PageState query={stats}>
        {(a) => {
          const p = pipeline(a);
          return (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat label="Leads" value={number(p.total)} />
              <Stat label="Still open" value={number(p.open)} hint="New, contacted, interested" />
              <Stat label="Invited" value={number(p.invited)} hint={`${p.responseRate}% responded`} />
              <Stat label="Converted" value={number(p.converted)} />
              <Stat label="Conversion" value={`${p.conversionRate}%`} />
            </div>
          );
        }}
      </PageState>

      <div className="flex flex-wrap items-center gap-2">
        <Input aria-label="Search leads" placeholder="Search name, email, company" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected.length > 0 && <Button onClick={() => setInviting(selected)}><Send className="mr-2 h-4 w-4" />Invite {selected.length} selected</Button>}
      </div>

      <PageState query={leads} empty="No leads match. Add one or import a CSV.">
        {(rows) => <DataTable rows={rows} columns={columns} rowKey={(l) => l.id} />}
      </PageState>

      <AddLead open={adding} onOpenChange={setAdding} />
      <ImportLeads open={importing} onOpenChange={setImporting} />
      <InviteLeads ids={inviting} onClose={() => { setInviting([]); setSelected([]); }} />
    </div>
  );
}
