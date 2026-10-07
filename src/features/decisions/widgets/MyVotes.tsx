import { Link } from "react-router-dom";
import { PageState } from "@/platform/ui/PageState";
import { Panel } from "@/platform/ui/kit";
import { usePending } from "../hooks";
import { votesWaiting } from "../logic";

export default function MyVotes() {
  const q = usePending();
  return (
    <Panel title="My votes">
      <PageState query={q}>
        {(actions) => {
          const n = votesWaiting(actions);
          return (
            <Link to="/decisions" className="block rounded-lg hover:bg-accent/50">
              <div className="font-display text-3xl font-bold">{n}</div>
              <div className="text-sm text-muted-foreground">{n === 0 ? "Nothing waiting for your vote" : n === 1 ? "session waiting for your vote" : "sessions waiting for your vote"}</div>
            </Link>
          );
        }}
      </PageState>
    </Panel>
  );
}
