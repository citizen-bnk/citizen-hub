import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { Field, Panel, Status } from "@/platform/ui/kit";
import { dateTime } from "@/platform/format";
import { approveMinutes, type MeetingBundle, recordMinutes } from "../api";

export default function MinutesTab({ bundle: { meeting, minutes }, canWrite }: { bundle: MeetingBundle; canWrite: boolean }) {
  const [text, setText] = useState(minutes?.content ?? "");
  const [editing, setEditing] = useState(!minutes);
  const refresh = [["meetings"]];
  const save = useAction((content: string) => recordMinutes(meeting.id, content), { success: "Minutes saved", refresh, onDone: () => setEditing(false) });
  const approve = useAction(() => approveMinutes(meeting.id), { success: "Minutes approved", refresh });
  const empty = !text.trim();

  return (
    <Panel
      title={minutes ? `Minutes (version ${minutes.version})` : "Minutes"}
      actions={minutes && <Status value={minutes.approved ? "approved" : "draft"} />}
    >
      {editing && canWrite ? (
        <div className="space-y-3">
          <Field label="Minutes" multiline value={text} onChange={(e) => setText(e.target.value)} hint="Saving again records a new version, which needs approving." error={empty ? "Write the minutes before saving" : undefined} />
          <div className="flex justify-end gap-2">
            {minutes && <Button variant="outline" onClick={() => { setText(minutes.content); setEditing(false); }}>Cancel</Button>}
            <Button disabled={empty || save.isPending} onClick={() => save.mutate(text.trim())}>Save minutes</Button>
          </div>
        </div>
      ) : minutes ? (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{minutes.content}</p>
          <p className="text-xs text-muted-foreground">{minutes.approved ? `Approved ${dateTime(minutes.approved_at)}` : `Recorded ${dateTime(minutes.updated_at)}, waiting for approval`}</p>
          {canWrite && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Record a new version</Button>
              {!minutes.approved && <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(undefined)}>Approve minutes</Button>}
            </div>
          )}
        </div>
      ) : <p className="text-sm text-muted-foreground">No minutes have been recorded yet.</p>}
    </Panel>
  );
}
