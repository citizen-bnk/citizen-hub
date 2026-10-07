import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Confirm, Drawer, Panel, Status } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import { type Member, removeMember } from "../api";
import { useHistory, useMembers, useUnmapped } from "../hooks";
import { needsLink, termDaysLeft, termWords } from "../logic";
import { EditDialog, LinkDialog } from "./MemberDialogs";

/** Everything about one member: position and term, share requirement, documents, position history, and the edit actions. */
export default function MemberDrawer({ memberId, onClose }: { memberId: number | null; onClose: () => void }) {
  const members = useMembers();
  const member = members.data?.find((m) => m.board_member_id === memberId);
  return (
    <Drawer open={memberId !== null} onOpenChange={(o) => !o && onClose()} title={member?.full_name ?? "Board member"} description={member?.email}>
      {member && <Detail member={member} onGone={onClose} />}
    </Drawer>
  );
}

function Detail({ member: m, onGone }: { member: Member; onGone: () => void }) {
  const history = useHistory(m.board_member_id);
  const unmapped = useUnmapped();
  const [dialog, setDialog] = useState<"edit" | "link" | "remove" | null>(null);
  const remove = useAction(removeMember, { success: "Member removed", refresh: [["roster"]], onDone: onGone });
  const unlinked = needsLink(m, new Set((unmapped.data ?? []).map((u) => u.email.toLowerCase())));
  const inv = m.investment_status;
  const docs = m.document_compliance;
  const days = termDaysLeft(m.term_end_date);

  return (
    <>
      <Panel title="Position and term">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Position</dt><dd>{m.position_name ?? "None"}</dd>
          <dt className="text-muted-foreground">Appointed</dt><dd>{date(m.appointed_at)}</dd>
          <dt className="text-muted-foreground">Term ends</dt><dd>{date(m.term_end_date)} <span className="text-muted-foreground">({termWords(days)})</span></dd>
          <dt className="text-muted-foreground">Status</dt><dd><Status value={m.status === "inactive" ? "pending" : m.status} /></dd>
          <dt className="text-muted-foreground">Profile complete</dt><dd>{m.profile_completion_percentage ?? 0}%</dd>
        </dl>
      </Panel>
      <Panel title="Share requirement">
        {inv ? (
          <div className="space-y-2 text-sm">
            <Progress value={Math.min(100, (inv.total_shares / Math.max(inv.required_shares, 1)) * 100)} aria-label="Shares held against requirement" />
            <p>{inv.total_shares} of {inv.required_shares} shares held. {inv.meets_requirement ? "Requirement met." : `${inv.shares_needed} more needed.`}</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">No share requirement for this position.</p>}
      </Panel>
      <Panel title="Documents">
        {docs ? (
          <div className="space-y-2 text-sm">
            <Progress value={docs.compliance_percentage} aria-label="Documents approved" />
            <p>{docs.approved} approved, {docs.pending_review} in review, {docs.missing} missing of {docs.total_required} required.</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">No document information yet.</p>}
        <Link to="/office/compliance" className="mt-2 inline-block text-sm text-primary-light">Review documents</Link>
      </Panel>
      <Panel title="Position history">
        <PageState query={history} empty="No position history yet.">
          {(rows) => (
            <ul className="space-y-2 text-sm">
              {rows.map((h) => (
                <li key={h.id} className="flex justify-between gap-2">
                  <span>{label(h.position_name)}{h.is_current && " (current)"}</span>
                  <span className="text-muted-foreground">{date(h.appointed_at)} to {h.ended_at ? date(h.ended_at) : "now"}</span>
                </li>
              ))}
            </ul>
          )}
        </PageState>
      </Panel>
      <div className="flex flex-wrap gap-2">
        {m.user_id && <Button variant="outline" onClick={() => setDialog("edit")}>Edit</Button>}
        {unlinked && <Button variant="outline" onClick={() => setDialog("link")}>Link account</Button>}
        {m.user_id && <Button variant="outline" className="text-destructive" onClick={() => setDialog("remove")}>Remove</Button>}
      </div>
      {dialog === "edit" && <EditDialog member={m} onClose={() => setDialog(null)} />}
      {dialog === "link" && <LinkDialog member={m} onClose={() => setDialog(null)} />}
      <Confirm
        open={dialog === "remove"} onOpenChange={(o) => !o && setDialog(null)} destructive confirmLabel="Remove" busy={remove.isPending}
        title={`Remove ${m.full_name}?`} description="They lose board access. Their position history is kept."
        onConfirm={() => m.user_id && remove.mutate(m.user_id)}
      />
    </>
  );
}
