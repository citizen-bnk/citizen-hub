import { EngagementPanel } from "./EngagementPanel";
import { FeaturesPanel } from "./FeaturesPanel";
import { DraftsPanel } from "./DraftsPanel";

/** The "feature highlight" pipeline: settings and numbers, the features to highlight, then the emails drafted from them. */
export function CampaignsTab() {
  return (
    <div className="space-y-6">
      <EngagementPanel />
      <DraftsPanel />
      <FeaturesPanel />
    </div>
  );
}
