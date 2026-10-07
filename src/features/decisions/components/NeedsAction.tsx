import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { Field, Panel, Status } from "@/platform/ui/kit";
import { dateTime } from "@/platform/format";
import { decideApproval, type PendingAction } from "../api";
import { splitActions } from "../logic";
import VoteDrawer from "./VoteDrawer";

export default function NeedsAction({ query }: { query: Pick<UseQueryResult<PendingAction[]>, "data" | "isPending" | "isError" | "error" | "refetch" | "isFetching"> }) {
  const [voting, setVoting] = useState<PendingAction | null>(null);
  return (
    <PageState query={query} empty="You are all caught up. Nothing needs your vote or approval.">
      {(all) => {
        const { votes, approvals } = splitActions(all);
        return (
          <div className="space-y-4">
            {votes.length > 0 && (
              <Panel title="Open for your vote">
                <ul className="divide-y">
                  {votes.map((a) => (
                    <li key={a.session_id} className="flex flex-wrap items-center gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.deadline ? `Closes ${dateTime(a.deadline)}` : a.description}</div>
                      </div>
                      {a.priority !== "normal" && <Status value="pending" />}
                      <Button size="sm" onClick={() => setVoting(a)}>Vote</Button>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {approvals.length > 0 && (
              <Panel title="Documents awaiting your approval">
                <ul className="divide-y">{approvals.map((a) => <ApprovalRow key={a.session_id} action={a} />)}</ul>
              </Panel>
            )}
            {voting && <VoteDrawer sessionId={voting.session_id} title={voting.title} onClose={() => setVoting(null)} />}
          </div>
        );
      }}
    </PageState>
  );
}

function ApprovalRow({ action }: { action: PendingAction }) {
  const [asking, setAsking] = useState(false);
  const [comments, setComments] = useState("");
  const decide = useAction((status: "approved" | "changes_requested") => decideApproval({ item_id: action.session_id, status, comments: comments.trim() || undefined }), {
    success: "Your answer is recorded",
    refresh: [["decisions"]],
  });
  return (
    <li className="space-y-2 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{action.title}</div>
          <div className="truncate text-xs text-muted-foreground">{action.description}</div>
        </div>
        <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate("approved")}>Approve</Button>
        <Button size="sm" variant="outline" onClick={() => setAsking((v) => !v)}>Request changes</Button>
      </div>
      {asking && (
        <div className="space-y-2">
          <Field label="What should change?" multiline value={comments} onChange={(e) => setComments(e.target.value)} />
          <Button size="sm" disabled={!comments.trim() || decide.isPending} onClick={() => decide.mutate("changes_requested")}>Send</Button>
        </div>
      )}
    </li>
  );
}
