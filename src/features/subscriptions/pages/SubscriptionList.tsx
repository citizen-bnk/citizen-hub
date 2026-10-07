import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession } from "@/platform/auth/session";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, PrimaryButton, Stat, Status } from "@/platform/ui/kit";
import { date, label, money } from "@/platform/format";
import { useSubscriptions } from "../hooks";
import { filterSubs, STATUS_FILTERS, stats, type Filters, type Sub } from "../logic";
import { Pick } from "../components/Pick";
import { SubscriptionDrawer } from "../components/SubscriptionDrawer";

export default function SubscriptionList() {
  const { roles } = useSession();
  const [f, setF] = useState<Filters>({ search: "", status: "all", type: "all" });
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useSubscriptions(f.type);
  const types = [
    { value: "all", label: "All subscriptions" },
    // These two lists are only open to administrators on the backend.
    ...(roles.includes("super_admin") ? [{ value: "board", label: "Board members" }] : []),
    ...(roles.includes("super_admin") || roles.includes("admin") ? [{ value: "mine", label: "Created by me" }] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Subscriptions" description="Check payments, issue certificates and documents."
        actions={<Link to="/office/subscriptions/new"><PrimaryButton><Plus className="mr-1 h-4 w-4" aria-hidden />New subscription</PrimaryButton></Link>} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterBar f={f} setF={setF} types={types} />
      </div>

      <PageState query={list} empty="No subscriptions here yet.">
        {(rows) => {
          const s = stats(rows);
          const shown = filterSubs(rows, f);
          return (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Awaiting verification" value={s.awaitingVerification} />
                <Stat label="Pending payment" value={s.pendingPayment} />
                <Stat label="Collected" value={money(s.paid)} hint={`of ${money(s.total)}`} />
                <Stat label="Still owed" value={money(s.outstanding)} hint={`${s.completed} of ${s.count} completed`} />
              </div>
              {shown.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing matches these filters.</p> : (
                <DataTable rows={shown} rowKey={(r) => r.id} onRow={(r) => setOpenId(r.id)} columns={[
                  { key: "who", header: "Investor", cell: (r: Sub) => <><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.id}</div></> },
                  { key: "shares", header: "Shares", cell: (r) => r.shares, className: "text-right" },
                  { key: "total", header: "Total", cell: (r) => money(r.total), className: "text-right" },
                  { key: "paid", header: "Paid", cell: (r) => money(r.paid), className: "text-right" },
                  { key: "status", header: "Status", cell: (r) => <Status value={r.status === "active" ? r.paymentStatus : r.status} /> },
                  { key: "date", header: "Created", cell: (r) => date(r.createdAt), className: "hidden sm:table-cell" },
                ]} />
              )}
              <SubscriptionDrawer sub={rows.find((r) => r.id === openId) ?? null} onClose={() => setOpenId(null)} />
            </>
          );
        }}
      </PageState>
    </div>
  );
}

function FilterBar({ f, setF, types }: { f: Filters; setF: (f: Filters) => void; types: { value: string; label: string }[] }) {
  return (
    <>
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="sub-search" className="text-sm font-medium leading-none">Search</label>
        <Input id="sub-search" placeholder="Name, email or subscription number" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
      </div>
      <Pick label="Status" value={f.status} onChange={(status) => setF({ ...f, status })} options={STATUS_FILTERS.map((v) => ({ value: v, label: v === "all" ? "Any status" : label(v) }))} />
      <Pick label="Type" value={f.type} onChange={(type) => setF({ ...f, type: type as Filters["type"] })} options={types} />
    </>
  );
}
