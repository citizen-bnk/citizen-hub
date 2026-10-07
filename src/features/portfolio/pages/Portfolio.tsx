import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { date, money, number } from "@/platform/format";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, Stat, Status } from "@/platform/ui/kit";
import { useSubscriptions } from "../hooks";
import { remaining, summarise } from "../logic";

export default function Portfolio() {
  const q = useSubscriptions();
  const go = useNavigate();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="My investments" description="Your share subscriptions, what you have paid and what is still due." actions={<Button asChild><Link to="/portfolio/buy">Buy shares</Link></Button>} />
      <PageState query={q} empty={<>You have no investments yet. <Link className="text-primary-light underline" to="/portfolio/buy">Buy shares</Link></>}>
        {(subs) => {
          const s = summarise(subs);
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Shares held" value={number(s.shares)} />
                <Stat label="Total invested" value={money(s.invested)} />
                <Stat label="Paid so far" value={money(s.paid)} />
                <Stat label="Still to pay" value={money(s.owed)} hint={s.pending ? `${s.pending} awaiting payment` : undefined} />
              </div>
              <DataTable
                rows={subs}
                rowKey={(r) => r.subscription_id ?? `${r.created_at}-${r.num_shares}`}
                onRow={(r) => r.subscription_id && go(`/portfolio/${r.subscription_id}`)}
                columns={[
                  { key: "ref", header: "Reference", cell: (r) => <span className="font-medium">{r.subscription_id ?? "Pending"}</span> },
                  { key: "class", header: "Class", cell: (r) => r.share_class },
                  { key: "shares", header: "Shares", cell: (r) => number(r.num_shares), className: "text-right" },
                  { key: "total", header: "Amount", cell: (r) => money(r.total_amount), className: "text-right" },
                  { key: "due", header: "Still due", cell: (r) => money(remaining(r)), className: "text-right" },
                  { key: "date", header: "Date", cell: (r) => date(r.created_at) },
                  { key: "status", header: "Status", cell: (r) => <Status value={r.status === "cancelled" ? "cancelled" : r.payment_status ?? r.status} /> },
                ]}
              />
            </div>
          );
        }}
      </PageState>
    </div>
  );
}
