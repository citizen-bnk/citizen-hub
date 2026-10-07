import { Link } from "react-router-dom";
import { PageState } from "@/platform/ui/PageState";
import { Panel } from "@/platform/ui/kit";
import { useSubscriptions } from "../hooks";
import { stats } from "../logic";

/** Home tile for the back office: how many subscriptions wait on a person. */
export default function ToVerify() {
  const list = useSubscriptions("all");
  return (
    <Panel title="Subscriptions">
      <PageState query={list}>
        {(rows) => {
          const s = stats(rows);
          return (
            <div className="space-y-3 text-sm">
              <div className="flex gap-6">
                <div><div className="font-display text-2xl font-bold">{s.awaitingVerification}</div><div className="text-muted-foreground">awaiting verification</div></div>
                <div><div className="font-display text-2xl font-bold">{s.pendingPayment}</div><div className="text-muted-foreground">pending payment</div></div>
              </div>
              <Link to="/office/subscriptions" className="text-primary-light underline-offset-2 hover:underline">Open subscriptions</Link>
            </div>
          );
        }}
      </PageState>
    </Panel>
  );
}
