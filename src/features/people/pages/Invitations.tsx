import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader, DataTable, Confirm, Panel, Status, type Column } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { useSession } from "@/platform/auth/session";
import { date, label } from "@/platform/format";
import { cancelInvitation, checkCanInvite, listInvitations, resendInvitation, type Invitation } from "../api";
import { InviteForm } from "../components/InviteForm";
import { INVITABLE_ROLES, INVITATION_TABS, canCancel, canResend, effectiveStatus, inTab, permittedRoles, type InvitationTab } from "../logic";

export default function Invitations() {
  const { roles } = useSession();
  const isSuperAdmin = roles.includes("super_admin");
  const [tab, setTab] = useState<InvitationTab>("all");
  const [cancelling, setCancelling] = useState<Invitation | null>(null);

  const checks = useQueries({
    queries: INVITABLE_ROLES.map((r) => ({ queryKey: ["people", "can-invite", r], queryFn: () => checkCanInvite(r), staleTime: 300_000 })),
  });
  const invitable = permittedRoles(Object.fromEntries(INVITABLE_ROLES.map((r, i) => [r, checks[i].data?.can_invite])));
  const checking = checks.some((c) => c.isPending);

  const list = useQuery({ queryKey: ["people", "invitations"], queryFn: listInvitations });
  const resend = useAction(resendInvitation, { success: "Invitation sent again", refresh: [["people", "invitations"]] });
  const cancel = useAction(cancelInvitation, { success: "Invitation cancelled", refresh: [["people", "invitations"]], onDone: () => setCancelling(null) });

  const columns: Column<Invitation>[] = [
    { key: "who", header: "Invitee", cell: (i) => <div><div className="font-medium">{i.full_name || i.email}</div>{i.full_name && <div className="text-xs text-muted-foreground">{i.email}</div>}</div> },
    { key: "role", header: "Role", cell: (i) => label(i.position ? `${i.role} (${i.position})` : i.role) },
    { key: "status", header: "Status", cell: (i) => <Status value={effectiveStatus(i)} /> },
    { key: "by", header: "Invited by", className: "hidden md:table-cell", cell: (i) => i.invited_by_name ?? "—" },
    { key: "sent", header: "Sent", className: "hidden sm:table-cell", cell: (i) => date(i.created_at) },
    { key: "exp", header: "Expires", className: "hidden lg:table-cell", cell: (i) => date(i.expires_at) },
    {
      key: "act", header: "", className: "text-right whitespace-nowrap",
      cell: (i) => {
        const s = effectiveStatus(i);
        return (
          <div className="flex justify-end gap-1">
            {canResend(s) && <Button size="sm" variant="outline" disabled={resend.isPending} onClick={() => resend.mutate(i.id)}>Resend</Button>}
            {canCancel(s, isSuperAdmin) && <Button size="sm" variant="ghost" onClick={() => setCancelling(i)}>Cancel</Button>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Invitations" description="Invite people into the Hub and follow what happened to each invitation." />
      {checking ? null : invitable.length > 0 ? (
        <InviteForm roles={invitable} />
      ) : (
        <Panel><p className="text-sm text-muted-foreground">Your role does not allow inviting anyone yet. An administrator can change this.</p></Panel>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as InvitationTab)}>
        <TabsList>{INVITATION_TABS.map((t) => <TabsTrigger key={t} value={t}>{label(t)}</TabsTrigger>)}</TabsList>
      </Tabs>
      <PageState query={list} empty="No invitations yet" isEmpty={(d) => d.invitations.length === 0}>
        {({ invitations }) => {
          const rows = invitations.filter((i) => inTab(effectiveStatus(i), tab));
          return rows.length ? <DataTable rows={rows} columns={columns} rowKey={(i) => i.id} /> : <p className="text-sm text-muted-foreground">Nothing in this tab.</p>;
        }}
      </PageState>

      <Confirm
        open={!!cancelling} onOpenChange={(o) => !o && setCancelling(null)} destructive confirmLabel="Cancel invitation" busy={cancel.isPending}
        title="Cancel this invitation?" description={cancelling && `${cancelling.email} will no longer be able to use their invitation link.`}
        onConfirm={() => cancelling && cancel.mutate(cancelling.id)}
      />
    </div>
  );
}
