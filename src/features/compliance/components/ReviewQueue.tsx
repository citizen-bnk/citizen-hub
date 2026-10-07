import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction, useDownload } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Confirm, DataTable, Field } from "@/platform/ui/kit";
import { dateTime } from "@/platform/format";
import { type ReviewItem, downloadDocument, reviewDocument } from "../api";
import { useReviewQueue } from "../hooks";
import { rejectionReason } from "../logic";

export default function ReviewQueue() {
  const q = useReviewQueue();
  const [rejecting, setRejecting] = useState<ReviewItem | null>(null);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const review = useAction(reviewDocument, { success: "Decision saved", refresh: [["compliance"]], onDone: () => setRejecting(null) });
  const get = useDownload(downloadDocument);
  const error = touched ? rejectionReason(reason) : null;

  return (
    <>
      <PageState query={q} empty="Nothing is waiting for review.">
        {(rows) => (
          <DataTable
            rows={rows}
            rowKey={(r) => r.document_id}
            columns={[
              { key: "m", header: "Member", cell: (r) => <div><div className="font-medium">{r.board_member_name}</div><div className="text-xs text-muted-foreground">{r.board_member_email}</div></div> },
              { key: "d", header: "Document", cell: (r) => <div><div>{r.requirement_name}</div><div className="text-xs text-muted-foreground">{r.file_name}{r.resubmission_count > 0 ? ` · resubmitted ${r.resubmission_count}x` : ""}</div></div> },
              { key: "s", header: "Sent", cell: (r) => dateTime(r.submitted_at) },
              {
                key: "a", header: "", className: "text-right", cell: (r) => (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => get.mutate(r.document_id)}>View</Button>
                    <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ documentId: r.document_id, action: "approve" })}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReason(""); setTouched(false); setRejecting(r); }}>Reject</Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </PageState>
      <Confirm
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title={`Reject ${rejecting?.requirement_name ?? "document"}?`}
        description={
          <span className="block pt-2">
            <Field label="Reason (the member sees this)" multiline value={reason} error={error ?? undefined} onChange={(e) => { setReason(e.target.value); setTouched(true); }} />
          </span>
        }
        confirmLabel="Reject"
        destructive
        busy={review.isPending}
        onConfirm={() => {
          setTouched(true);
          if (rejecting && !rejectionReason(reason)) review.mutate({ documentId: rejecting.document_id, action: "reject", reason: reason.trim() });
        }}
      />
    </>
  );
}
