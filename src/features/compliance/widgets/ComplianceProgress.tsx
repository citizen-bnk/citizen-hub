import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { PageState } from "@/platform/ui/PageState";
import { Panel } from "@/platform/ui/kit";
import { useChecklist } from "../hooks";
import { progress } from "../logic";

export default function ComplianceProgress() {
  const q = useChecklist();
  return (
    <Panel title="Licence documents">
      <PageState query={q}>
        {({ items }) => {
          const p = progress(items);
          return (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between text-sm">
                <span>{p.approved} of {p.required} approved</span>
                <span className="font-display text-xl font-bold">{p.percent}%</span>
              </div>
              <Progress value={p.percent} aria-label="Documents approved" />
              <p className="text-sm text-muted-foreground">
                {p.missing.length ? `Still needed: ${p.missing.slice(0, 3).join(", ")}${p.missing.length > 3 ? ` and ${p.missing.length - 3} more` : ""}` : "Nothing is missing."}
              </p>
              <Link to="/compliance" className="text-sm text-primary-light">Open my compliance</Link>
            </div>
          );
        }}
      </PageState>
    </Panel>
  );
}
