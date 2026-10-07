import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, Field, Panel, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { dateTime } from "@/platform/format";
import { useLoiSubmissions, usePendingAgreements, useReviewLoi, useSignedAgreements } from "../hooks";
import { agreementLabel, shortId } from "../logic";
import type { LoiSubmission } from "../api";

/** Letters of intent to review, who has signed what, and who still has to sign. */
export default function AgreementsTab() {
  const loi = useLoiSubmissions();
  const signed = useSignedAgreements();
  const pending = usePendingAgreements();
  const [review, setReview] = useState<LoiSubmission | null>(null);

  return (
    <div className="space-y-6">
      <Panel title="Letters of intent">
        <PageState query={loi} isEmpty={(l) => l.submissions.length === 0} empty="No letters of intent submitted.">
          {({ submissions }) => (
            <DataTable
              rows={submissions}
              rowKey={(s) => s.id}
              columns={[
                { key: "p", header: "Person", cell: (s) => <span title={s.user_id}>{shortId(s.user_id)}</span> },
                { key: "w", header: "Submitted", cell: (s) => dateTime(s.submitted_at) },
                { key: "s", header: "Status", cell: (s) => <Status value={s.status} /> },
                { key: "n", header: "Notes", cell: (s) => s.notes ?? "—" },
                { key: "a", header: "", className: "text-right", cell: (s) => <Button size="sm" variant="outline" onClick={() => setReview(s)}>{s.status === "pending" ? "Review" : "Change"}</Button> },
              ]}
            />
          )}
        </PageState>
      </Panel>

      <Panel title="Still to sign">
        <PageState query={pending} isEmpty={(p) => p.pending_users.length === 0} empty="Every investor has signed all three agreements.">
          {({ pending_users }) => (
            <DataTable
              rows={pending_users}
              rowKey={(p) => p.user_id}
              columns={[
                { key: "p", header: "Person", cell: (p) => <span title={p.user_id}>{shortId(p.user_id)}</span> },
                { key: "m", header: "Missing", cell: (p) => p.missing_agreements.map(agreementLabel).join(", ") },
                { key: "i", header: "Investing", cell: (p) => [p.has_subscriptions && "Subscription", p.has_board_investments && "Board investment"].filter(Boolean).join(", ") || "—" },
              ]}
            />
          )}
        </PageState>
      </Panel>

      <Panel title="Signed agreements">
        <PageState query={signed} isEmpty={(s) => s.agreements.length === 0} empty="Nothing signed yet.">
          {({ agreements }) => (
            <DataTable
              rows={agreements}
              rowKey={(a) => a.id}
              columns={[
                { key: "p", header: "Person", cell: (a) => <span title={a.user_id}>{shortId(a.user_id)}</span> },
                { key: "t", header: "Agreement", cell: (a) => agreementLabel(a.agreement_type) },
                { key: "v", header: "Version", cell: (a) => a.agreement_version ?? "—" },
                { key: "w", header: "Signed", cell: (a) => dateTime(a.signed_at) },
                { key: "ip", header: "Address", cell: (a) => a.ip_address ?? "—" },
              ]}
            />
          )}
        </PageState>
      </Panel>

      {review && <ReviewDialog key={review.id} submission={review} onClose={() => setReview(null)} />}
    </div>
  );
}

function ReviewDialog({ submission, onClose }: { submission: LoiSubmission; onClose: () => void }) {
  const [notes, setNotes] = useState(submission.notes ?? "");
  const save = useReviewLoi();
  const decide = (status: "approved" | "rejected") => save.mutate({ id: submission.id, status, notes: notes.trim() || null }, { onSuccess: onClose });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review letter of intent</DialogTitle>
          <DialogDescription>Submitted {dateTime(submission.submitted_at)} by {shortId(submission.user_id)}. The investor sees the outcome in their data room.</DialogDescription>
        </DialogHeader>
        <Field label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={save.isPending} onClick={() => decide("rejected")}>Reject</Button>
          <Button disabled={save.isPending} onClick={() => decide("approved")}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
