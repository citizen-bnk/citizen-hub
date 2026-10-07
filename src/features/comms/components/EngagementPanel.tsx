import { Switch } from "@/components/ui/switch";
import { number } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { Panel, Stat } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { engagement } from "../api";
import { KEY, useConfig, useStats } from "../hooks";

export function EngagementPanel() {
  const stats = useStats();
  const config = useConfig();
  const save = useAction(engagement.saveConfig, { success: "Settings saved", refresh: [[...KEY.campaigns, "config"]] });
  return (
    <Panel title="Engagement">
      <PageState query={stats}>
        {(s) => (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Possible recipients" value={number(s.total_eligible_recipients)} hint="Active board members" />
            <Stat label="Emails sent" value={number(s.total_sent)} />
            <Stat label="Opened" value={`${s.open_rate}%`} hint={`${number(s.total_opened)} emails`} />
            <Stat label="Clicked" value={`${s.click_rate}%`} hint={`${number(s.total_clicked)} emails`} />
          </div>
        )}
      </PageState>
      <PageState query={config}>
        {(c) => (
          <label className="mt-4 flex items-center gap-3 text-sm">
            <Switch
              checked={c.auto_send_enabled} disabled={save.isPending} aria-label="Send approved emails automatically"
              onCheckedChange={(on) => save.mutate({ ...c, auto_send_enabled: on })}
            />
            Send approved emails automatically{c.send_time ? ` at ${c.send_time.slice(0, 5)}` : ""}
          </label>
        )}
      </PageState>
    </Panel>
  );
}
