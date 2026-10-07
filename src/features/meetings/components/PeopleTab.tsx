import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { Panel, Status } from "@/platform/ui/kit";
import { label } from "@/platform/format";
import { type AttendanceStatus, inviteMembers, type MeetingBundle, markAttendance, resendInvitations, rsvp } from "../api";
import { useBoardMembers } from "../hooks";
import { attendanceCounts, rsvpCounts } from "../logic";
import { Select } from "./Select";

const ATTENDANCE: AttendanceStatus[] = ["present", "late", "excused", "absent"];

export default function PeopleTab({ bundle: { meeting, invitees, attendance }, canWrite, isBoard }: { bundle: MeetingBundle; canWrite: boolean; isBoard: boolean }) {
  const refresh = [["meetings", "one", meeting.id]];
  const [picked, setPicked] = useState<string[]>([]);
  const mark = useAction((v: { id: string; status: AttendanceStatus }) => markAttendance(meeting.id, { board_member_id: v.id, status: v.status }), { success: "Attendance saved", refresh });
  const answer = useAction((v: "accepted" | "declined" | "tentative") => rsvp(meeting.id, v), { success: "Your reply is saved", refresh });
  const resend = useAction(() => resendInvitations(meeting.id, picked), { success: "Invitations sent again", refresh, onDone: () => setPicked([]) });
  const rc = rsvpCounts(invitees);
  const ac = attendanceCounts(attendance);
  const status = (id: string) => attendance.find((a) => a.board_member_id === id)?.status;

  return (
    <div className="space-y-4">
      {isBoard && (
        <Panel title="Will you attend?">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={answer.isPending} onClick={() => answer.mutate("accepted")}>Accept</Button>
            <Button size="sm" variant="outline" disabled={answer.isPending} onClick={() => answer.mutate("tentative")}>Maybe</Button>
            <Button size="sm" variant="outline" disabled={answer.isPending} onClick={() => answer.mutate("declined")}>Decline</Button>
          </div>
        </Panel>
      )}
      <Panel
        title={`Invitees (${invitees.length})`}
        actions={canWrite && <Button size="sm" variant="outline" disabled={!picked.length || resend.isPending} onClick={() => resend.mutate(undefined)}>Resend to selected</Button>}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          {rc.accepted} accepted, {rc.tentative} maybe, {rc.declined} declined, {rc.pending} waiting
          {attendance.length > 0 && ` · Present ${ac.present + ac.late}, excused ${ac.excused}, absent ${ac.absent}`}
        </p>
        {invitees.length === 0 ? <p className="text-sm text-muted-foreground">Nobody has been invited yet.</p> : (
          <ul className="divide-y">
            {invitees.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                {canWrite && <Checkbox aria-label={`Select ${i.email}`} checked={picked.includes(i.board_member_id)} onCheckedChange={() => setPicked((l) => (l.includes(i.board_member_id) ? l.filter((x) => x !== i.board_member_id) : [...l, i.board_member_id]))} />}
                <span className="min-w-0 flex-1 truncate">{i.email}</span>
                <Status value={i.rsvp_status} />
                {canWrite ? (
                  <Select label={`Attendance for ${i.email}`} className="w-32 [&>label]:sr-only" value={status(i.board_member_id) ?? ""} onChange={(v) => mark.mutate({ id: i.board_member_id, status: v as AttendanceStatus })}
                    options={[{ value: "", label: "Not recorded" }, ...ATTENDANCE.map((s) => ({ value: s, label: label(s) }))]} />
                ) : status(i.board_member_id) && <span className="text-muted-foreground">{label(status(i.board_member_id))}</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {canWrite && <InviteMore meetingId={meeting.id} already={invitees.map((i) => i.board_member_id)} />}
    </div>
  );
}

function InviteMore({ meetingId, already }: { meetingId: string; already: string[] }) {
  const members = useBoardMembers();
  const [picked, setPicked] = useState<string[]>([]);
  const invite = useAction(() => inviteMembers(meetingId, picked), { success: "Invitations sent", refresh: [["meetings", "one", meetingId]], onDone: () => setPicked([]) });
  return (
    <Panel title="Invite more members" actions={<Button size="sm" disabled={!picked.length || invite.isPending} onClick={() => invite.mutate(undefined)}>Send invitations</Button>}>
      <PageState query={members} isEmpty={(l) => l.filter((m) => !already.includes(m.user_id)).length === 0} empty="Every active board member is already invited.">
        {(list) => (
          <ul className="space-y-2">
            {list.filter((m) => !already.includes(m.user_id)).map((m) => (
              <li key={m.user_id} className="flex items-center gap-3">
                <Checkbox id={`more-${m.user_id}`} checked={picked.includes(m.user_id)} onCheckedChange={() => setPicked((l) => (l.includes(m.user_id) ? l.filter((x) => x !== m.user_id) : [...l, m.user_id]))} />
                <label htmlFor={`more-${m.user_id}`} className="text-sm">{m.full_name} <span className="text-muted-foreground">{m.position ?? m.email}</span></label>
              </li>
            ))}
          </ul>
        )}
      </PageState>
    </Panel>
  );
}
