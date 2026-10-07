import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Confirm, Drawer, Field, Panel, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { date, dateTime, label } from "@/platform/format";
import { allRoles, assignRole, loginHistory, reactivateUser, removeRole, roleHistory, suspendUser, suspensionHistory, type UserRow } from "../api";
import { canReactivate, canSuspend, grantable } from "../logic";

type Pending = { kind: "grant" | "revoke"; role: string } | { kind: "suspend" } | { kind: "reactivate" } | null;
const refresh = [["people", "users"]];

export function UserDrawer({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  return (
    <Drawer open={!!user} onOpenChange={(o) => !o && onClose()} title={user?.full_name || user?.email || "User"} description={user?.email ?? undefined}>
      {user && <Body user={user} />}
    </Drawer>
  );
}

function Body({ user }: { user: UserRow }) {
  const id = user.user_id;
  const [ask, setAsk] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [pick, setPick] = useState("");
  const roles = useQuery({ queryKey: ["people", "roles"], queryFn: allRoles, staleTime: 300_000 });
  const done = () => setAsk(null);
  // The list refresh gives the drawer fresh roles and status, since the drawer's user comes from the list.
  const grant = useAction((role: string) => assignRole({ user_id: id, role_name: role }), { success: "Role granted", refresh: [...refresh, ["people", "history", id]], onDone: done });
  const revoke = useAction((role: string) => removeRole({ user_id: id, role_name: role }), { success: "Role removed", refresh: [...refresh, ["people", "history", id]], onDone: done });
  const suspend = useAction(() => suspendUser({ user_id: id, reason: reason.trim() }), { success: "User suspended", refresh: [...refresh, ["people", "history", id]], onDone: () => { done(); setReason(""); } });
  const reactivate = useAction(() => reactivateUser(id), { success: "User reactivated", refresh: [...refresh, ["people", "history", id]], onDone: done });
  const busy = grant.isPending || revoke.isPending || suspend.isPending || reactivate.isPending;

  const confirm = ((): { title: string; text: string; label: string; run: () => void; disabled?: boolean } | null => {
    if (!ask) return null;
    if (ask.kind === "grant") return { title: `Grant ${label(ask.role)}?`, text: "They get this role's access straight away.", label: "Grant", run: () => grant.mutate(ask.role) };
    if (ask.kind === "revoke") return { title: `Remove ${label(ask.role)}?`, text: "They lose this role's access straight away.", label: "Remove", run: () => revoke.mutate(ask.role) };
    if (ask.kind === "suspend") return { title: "Suspend this user?", text: "They cannot sign in until reactivated.", label: "Suspend", run: () => suspend.mutate(undefined), disabled: reason.trim().length < 3 };
    return { title: "Reactivate this user?", text: "They can sign in again.", label: "Reactivate", run: () => reactivate.mutate(undefined) };
  })();

  return (
    <>
      <Panel>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Status</dt><dd><Status value={user.status} /></dd>
          <dt className="text-muted-foreground">Phone</dt><dd>{user.phone || "—"}</dd>
          <dt className="text-muted-foreground">Account</dt><dd>{label(user.account_type)}</dd>
          <dt className="text-muted-foreground">Joined</dt><dd>{date(user.created_at)}</dd>
          <dt className="text-muted-foreground">Profile</dt><dd>{user.profile_completion_percentage}% complete</dd>
        </dl>
        <div className="mt-3">
          {canSuspend(user.status) && <Button variant="outline" size="sm" onClick={() => setAsk({ kind: "suspend" })}>Suspend</Button>}
          {canReactivate(user.status) && <Button variant="outline" size="sm" onClick={() => setAsk({ kind: "reactivate" })}>Reactivate</Button>}
        </div>
      </Panel>

      <Panel title="Roles">
        <div className="flex flex-wrap gap-2">
          {user.roles.length === 0 && <span className="text-sm text-muted-foreground">No roles</span>}
          {user.roles.map((r) => (
            <Badge key={r} variant="secondary" className="gap-1.5">
              {label(r)}
              <button type="button" aria-label={`Remove ${label(r)}`} className="rounded px-1 hover:bg-background/50" onClick={() => setAsk({ kind: "revoke", role: r })}>×</button>
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Select value={pick} onValueChange={setPick}>
            <SelectTrigger aria-label="Role to grant" className="w-52"><SelectValue placeholder="Add a role" /></SelectTrigger>
            <SelectContent>{grantable((roles.data ?? []).map((r) => r.role_name), user.roles).map((r) => <SelectItem key={r} value={r}>{label(r)}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" disabled={!pick} onClick={() => { setAsk({ kind: "grant", role: pick }); setPick(""); }}>Grant</Button>
        </div>
      </Panel>

      <Tabs defaultValue="roles">
        <TabsList><TabsTrigger value="roles">Role history</TabsTrigger><TabsTrigger value="security">Suspensions</TabsTrigger><TabsTrigger value="activity">Sign-ins</TabsTrigger></TabsList>
        <TabsContent value="roles"><RoleHistory id={id} /></TabsContent>
        <TabsContent value="security"><Suspensions id={id} /></TabsContent>
        <TabsContent value="activity"><SignIns id={id} /></TabsContent>
      </Tabs>

      <Confirm
        open={!!confirm} onOpenChange={(o) => !o && setAsk(null)} title={confirm?.title ?? ""} confirmLabel={confirm?.label}
        destructive={ask?.kind === "suspend" || ask?.kind === "revoke"} busy={busy}
        description={<><span>{confirm?.text}</span>
          {ask?.kind === "suspend" && <span className="mt-3 block"><Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} /></span>}</>}
        onConfirm={() => (confirm?.disabled ? undefined : confirm?.run())}
      />
    </>
  );
}

const Row = ({ title, meta, when }: { title: React.ReactNode; meta?: string | null; when: string }) => (
  <li className="flex items-start justify-between gap-3 border-b py-2 text-sm last:border-0">
    <div><div>{title}</div>{meta && <div className="text-xs text-muted-foreground">{meta}</div>}</div>
    <time className="whitespace-nowrap text-xs text-muted-foreground">{dateTime(when)}</time>
  </li>
);

function RoleHistory({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["people", "history", id, "roles"], queryFn: () => roleHistory(id), meta: { silent: true } });
  return (
    <PageState query={q} empty="No role changes recorded" isEmpty={(d) => d.role_events.length === 0}>
      {(d) => <ul>{d.role_events.map((e) => <Row key={e.id} title={`${label(e.action)} ${label(e.role_name)}`} meta={[e.performed_by_name && `by ${e.performed_by_name}`, e.reason].filter(Boolean).join(" · ")} when={e.changed_at} />)}</ul>}
    </PageState>
  );
}

function Suspensions({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["people", "history", id, "suspensions"], queryFn: () => suspensionHistory(id), meta: { silent: true } });
  return (
    <PageState query={q} empty="Never suspended" isEmpty={(d) => d.suspension_events.length === 0}>
      {(d) => <ul>{d.suspension_events.map((e) => <Row key={e.id} title={label(e.action)} meta={[e.suspended_by_name && `by ${e.suspended_by_name}`, e.reason].filter(Boolean).join(" · ")} when={e.suspended_at} />)}</ul>}
    </PageState>
  );
}

function SignIns({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["people", "history", id, "logins"], queryFn: () => loginHistory(id), meta: { silent: true } });
  return (
    <PageState query={q} empty="No sign-ins recorded" isEmpty={(d) => d.login_events.length === 0}>
      {(d) => (
        <>
          <p className="mb-2 text-xs text-muted-foreground">{d.successful_logins} successful, {d.failed_logins} failed. Last sign-in {dateTime(d.last_login)}.</p>
          <ul>{d.login_events.map((e) => <Row key={e.id} title={e.success ? "Signed in" : `Failed: ${e.failure_reason ?? "unknown"}`} meta={[e.location_city, e.location_country, e.ip_address].filter(Boolean).join(", ")} when={e.login_timestamp} />)}</ul>
        </>
      )}
    </PageState>
  );
}
