import { PageState } from "@/platform/ui/PageState";
import { Status } from "@/platform/ui/kit";
import { number, label } from "@/platform/format";
import type { Item, Results as R } from "../api";
import { useResults, useSession } from "../hooks";
import { tally } from "../logic";

const OUTCOME = { passed: "approved", not_passed: "rejected", tied: "pending", no_votes: "pending" } as const;

/** The result of every question in a closed session. */
export default function Results({ sessionId }: { sessionId: number }) {
  const results = useResults(sessionId);
  const details = useSession(sessionId);
  return (
    <PageState query={results}>
      {(r) => <Rows r={r} items={details.data?.items ?? []} />}
    </PageState>
  );
}

function Rows({ r, items }: { r: R; items: Item[] }) {
  const rows = items.length ? items.map((i) => ({ key: i.id, title: i.question })) : [{ key: 0, title: r.session.title }];
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const t = tally(r.results, row.key, r.total_voting_power);
        return (
          <li key={row.key} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium">{row.title}</div>
              <Status value={OUTCOME[t.outcome]} />
            </div>
            <div className="mt-1 text-muted-foreground">
              For {number(t.yes)} · Against {number(t.no)} · Abstain {number(t.abstain)} · Turnout {t.participation}%
              {t.outcome === "tied" && " · tied"}{t.outcome === "no_votes" && " · no votes"}
            </div>
          </li>
        );
      })}
      <li className="text-xs text-muted-foreground">{label(r.session.status)} · total voting power {number(r.total_voting_power)}</li>
    </ul>
  );
}
