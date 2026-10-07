import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Field, Panel, PrimaryButton } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { savePrefs } from "../api";
import { usePrefs } from "../hooks";
import { checkQuietHours, prefsPayload, prefsToForm, type PrefsForm } from "../logic";

const CHANNELS = [
  ["channel_email", "Email", "Notices and reminders to your inbox"],
  ["channel_sms", "Text message", "Short alerts to your mobile number"],
  ["channel_push", "Browser alerts", "Pop-up alerts while you use the Hub"],
] as const;

function Settings({ initial }: { initial: PrefsForm }) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof PrefsForm>(k: K, v: PrefsForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const problem = checkQuietHours(form);
  const save = useAction(() => savePrefs(prefsPayload(form)), { success: "Notification settings saved", refresh: [["account", "prefs"]] });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!problem) save.mutate(undefined); }}>
      <Panel title="How we reach you">
        <div className="divide-y">
          {CHANNELS.map(([key, name, hint]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div><Label id={`${key}-l`}>{name}</Label><p className="text-xs text-muted-foreground">{hint}</p></div>
              <Switch aria-labelledby={`${key}-l`} checked={form[key]} onCheckedChange={(c) => set(key, c)} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Do not disturb">
        <div className="flex items-center justify-between gap-4">
          <div><Label id="dnd-l">Pause alerts at night</Label><p className="text-xs text-muted-foreground">No text or browser alerts between these times.</p></div>
          <Switch aria-labelledby="dnd-l" checked={form.dnd} onCheckedChange={(c) => set("dnd", c)} />
        </div>
        {form.dnd && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="From" type="time" value={form.start} onChange={(e) => set("start", e.target.value)} />
            <Field label="Until" type="time" value={form.end} onChange={(e) => set("end", e.target.value)} />
            <Field label="Time zone" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </div>
        )}
        {problem && <p role="alert" className="mt-2 text-xs text-destructive">{problem}</p>}
      </Panel>
      <div className="flex justify-end"><PrimaryButton type="submit" disabled={save.isPending || !!problem}>{save.isPending ? "Saving…" : "Save settings"}</PrimaryButton></div>
    </form>
  );
}

export default function NotificationSettings() {
  const q = usePrefs();
  return <PageState query={q}>{(p) => <Settings initial={prefsToForm(p)} />}</PageState>;
}
