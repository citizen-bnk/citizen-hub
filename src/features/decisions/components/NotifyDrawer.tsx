import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { Drawer } from "@/platform/ui/kit";
import { notifyMembers, type NotifyMember } from "../api";
import { useNotifyCandidates } from "../hooks";

/** The one place members are told about a session: choose who, send. */
export default function NotifyDrawer({ sessionId, onClose }: { sessionId: number; onClose: () => void }) {
  const q = useNotifyCandidates(sessionId, true);
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title="Notify members" description="Each person gets an email about this session. Emails go out over the next few minutes.">
      <PageState query={q} empty="There are no active board members to notify.">{(list) => <Picker sessionId={sessionId} members={list} onDone={onClose} />}</PageState>
    </Drawer>
  );
}

function Picker({ sessionId, members, onDone }: { sessionId: number; members: NotifyMember[]; onDone: () => void }) {
  const [picked, setPicked] = useState<string[]>(members.map((m) => m.user_id));
  const send = useAction(() => notifyMembers(sessionId, picked), { onDone: onDone, success: "Notifications queued" });
  const all = picked.length === members.length;
  return (
    <>
      <div className="flex items-center gap-3 border-b pb-2">
        <Checkbox id="all" checked={all} onCheckedChange={() => setPicked(all ? [] : members.map((m) => m.user_id))} />
        <label htmlFor="all" className="text-sm font-medium">Everyone ({members.length})</label>
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3">
            <Checkbox id={`n-${m.user_id}`} checked={picked.includes(m.user_id)} onCheckedChange={() => setPicked((l) => (l.includes(m.user_id) ? l.filter((x) => x !== m.user_id) : [...l, m.user_id]))} />
            <label htmlFor={`n-${m.user_id}`} className="text-sm">{m.full_name} <span className="text-muted-foreground">{m.position ?? m.email}</span></label>
          </li>
        ))}
      </ul>
      <Button disabled={!picked.length || send.isPending} onClick={() => send.mutate(undefined)}>{send.isPending ? "Sending…" : `Notify ${picked.length}`}</Button>
    </>
  );
}
