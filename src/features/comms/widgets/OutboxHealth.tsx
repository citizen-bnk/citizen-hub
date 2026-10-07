import { Link } from "react-router-dom";
import { useQueue } from "../hooks";
import { failedCount } from "../logic";
import { Panel } from "@/platform/ui/kit";

/** Home tile: how many emails failed in the last week, with a way to the Outbox. */
export default function OutboxHealth() {
  const q = useQueue();
  if (!q.data) return null;
  const failed = failedCount(q.data.queue_stats);
  return (
    <Panel title="Outbox">
      <p className="text-sm">
        <span className="font-display text-2xl font-bold">{failed}</span>{" "}
        <span className="text-muted-foreground">{failed === 1 ? "email failed" : "emails failed"} in the last 7 days</span>
      </p>
      <Link to="/office/communications?tab=outbox" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
        {failed > 0 ? "Review and retry" : "Open the outbox"}
      </Link>
    </Panel>
  );
}
