import { Link } from "react-router-dom";
import { PageState } from "@/platform/ui/PageState";
import { Panel } from "@/platform/ui/kit";
import { useReviewQueue } from "../hooks";

export default function DocumentsToReview() {
  const q = useReviewQueue();
  return (
    <Panel title="Documents to review">
      <PageState query={q}>
        {(rows) => (
          <div className="space-y-2">
            <div className="font-display text-3xl font-bold">{rows.length}</div>
            <p className="text-sm text-muted-foreground">{rows.length === 0 ? "Nothing is waiting for review." : "submitted by board members, waiting for a decision."}</p>
            <Link to="/office/compliance" className="text-sm text-primary-light">Open member documents</Link>
          </div>
        )}
      </PageState>
    </Panel>
  );
}
