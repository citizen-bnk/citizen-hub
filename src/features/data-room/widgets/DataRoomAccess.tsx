import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Panel, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useMyAccess } from "../hooks";
import { accessSummary, agreementRows } from "../logic";

/** Home tile: where the person stands with the data room agreements. */
export default function DataRoomAccess() {
  const { access, status } = useMyAccess();
  return (
    <Panel title="Data room">
      <PageState query={access}>
        {(a) => (
          <PageState query={status}>
            {(s) => {
              const summary = accessSummary(agreementRows(s), a.has_access);
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Status value={a.has_access ? "approved" : "pending"} />
                    <span className="text-sm">{summary.text}</span>
                  </div>
                  <Link to="/data-room" className="inline-flex items-center gap-1 text-sm text-primary-light">
                    {a.has_access ? "Open the data room" : "Sign the agreements"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            }}
          </PageState>
        )}
      </PageState>
    </Panel>
  );
}
