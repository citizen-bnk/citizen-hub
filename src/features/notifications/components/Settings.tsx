import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Panel } from "@/platform/ui/kit";
import { useProfile } from "@/platform/profile";
import { savePrefs } from "../api";
import { usePrefs } from "../hooks";

/** Two channels, both real: the inbox (always on) and email. Nothing else is promised. */
export default function Settings() {
  const q = usePrefs();
  const email = useProfile().data?.email;
  const save = useAction((channel_email: boolean) => savePrefs({ channel_email }), { success: "Saved", refresh: [["notifications", "prefs"]] });
  return (
    <PageState query={q}>
      {(p) => (
        <Panel title="How we reach you">
          <div className="divide-y">
            <div className="flex items-center justify-between gap-4 pb-3">
              <div><Label>In the Hub</Label><p className="text-xs text-muted-foreground">Always on. New items show as a number on the bell and on your Home page.</p></div>
              <Switch checked disabled aria-label="In the Hub (always on)" />
            </div>
            <div className="flex items-center justify-between gap-4 pt-3">
              <div>
                <Label id="email-l">Email</Label>
                <p className="text-xs text-muted-foreground">A copy of each notification to {email ?? "your email address"}. Turn this off to see them only in the Hub.</p>
              </div>
              <Switch aria-labelledby="email-l" checked={p.channel_email} disabled={save.isPending} onCheckedChange={(c) => save.mutate(c)} />
            </div>
          </div>
        </Panel>
      )}
    </PageState>
  );
}
