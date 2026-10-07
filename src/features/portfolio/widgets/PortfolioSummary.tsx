import { Link } from "react-router-dom";
import { money, number } from "@/platform/format";
import { Panel } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useSubscriptions } from "../hooks";
import { isOutstanding, summarise } from "../logic";

export default function PortfolioSummary() {
  const q = useSubscriptions();
  return (
    <Panel title="My investments" actions={<Link to="/portfolio" className="text-sm text-primary-light">View all</Link>}>
      <PageState query={q} empty={<>No investments yet. <Link className="text-primary-light underline" to="/portfolio/buy">Buy shares</Link></>}>
        {(subs) => {
          const s = summarise(subs);
          const unpaid = subs.filter((x) => isOutstanding(x) && x.subscription_id);
          return (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-muted-foreground">Shares</div><div className="font-display text-xl font-bold">{number(s.shares)}</div></div>
                <div><div className="text-xs text-muted-foreground">Paid</div><div className="font-display text-xl font-bold">{money(s.paid)}</div></div>
              </div>
              {unpaid.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="font-medium">{money(s.owed)} still to pay</div>
                  {unpaid.map((u) => <Link key={u.subscription_id} to={`/portfolio/${u.subscription_id}`} className="mt-1 block text-primary-light">Pay {u.subscription_id}</Link>)}
                </div>
              )}
            </div>
          );
        }}
      </PageState>
    </Panel>
  );
}
