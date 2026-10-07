import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, Panel, Status } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import { remind, remindAll } from "../api";
import { useMembers, useRequirements } from "../hooks";
import { readiness } from "../logic";

/** Readiness per member, with a reminder for one member or for everyone. Reminders ask for every required document. */
export default function MemberReadiness() {
  const members = useMembers();
  const reqs = useRequirements();
  const required = (reqs.data ?? []).filter((r) => r.is_required).map((r) => r.id);
  const one = useAction(remind, { success: "Reminder sent" });
  const all = useAction(remindAll, { success: "Reminders sent to all active members" });

  return (
    <Panel
      actions={<Button size="sm" variant="outline" disabled={!required.length || all.isPending} onClick={() => all.mutate(required)}>Remind everyone</Button>}
    >
      <PageState query={members} empty="No active board members yet.">
        {(rows) => (
          <DataTable
            rows={rows}
            rowKey={(m) => m.board_member_id}
            columns={[
              { key: "n", header: "Member", cell: (m) => <div><div className="font-medium">{m.full_name}</div><div className="text-xs text-muted-foreground">{m.position}</div></div> },
              { key: "p", header: "Approved", className: "min-w-40", cell: (m) => (
                <div className="space-y-1"><Progress value={m.completion_percentage} aria-label={`${m.full_name} progress`} /><div className="text-xs text-muted-foreground">{m.total_approved} of {m.total_required}</div></div>
              ) },
              { key: "s", header: "Status", cell: (m) => <Status value={readiness(m) === "complete" ? "compliant" : readiness(m)} /> },
              { key: "l", header: "Last activity", cell: (m) => date(m.last_activity) },
              { key: "a", header: "", className: "text-right", cell: (m) => (
                <Button size="sm" variant="outline" disabled={!required.length || one.isPending || readiness(m) === "complete"} onClick={() => one.mutate({ memberId: m.board_member_id, requirementIds: required })}>Remind</Button>
              ) },
            ]}
          />
        )}
      </PageState>
    </Panel>
  );
}
