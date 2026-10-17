import { Workspace } from "@/components/Workspace";
import { Hero, Panel, Empty } from "@/components/BoardView";
import { RoleForm } from "@/components/RoleForm";
import { listUsers, roleHistory } from "@/lib/users";

export const dynamic = "force-dynamic";

export default function Users({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <Workspace module="users" path="/users">{async (person) => {
    const { open } = await searchParams;
    const users = await listUsers(person);
    const history = open && /^[0-9a-f-]{36}$/i.test(open) ? await roleHistory(person, open) : [];
    const isSuper = person.roles.includes("super_admin");
    return <>
      <Hero title="Users & Roles" subtitle="Who has access, and why." description="Role changes need a reason, are recorded, and sign the person out of their other sessions." kind="executive" />
      <Panel title={`People (${users.length})`}>
        {users.length ? users.map((user) => <details key={user.id} className="review-item" open={open === user.id}>
          <summary><span><strong>{user.display_name}</strong><small>{user.email}{user.last_sign_in ? ` · last signed in ${new Date(user.last_sign_in).toLocaleDateString("en-ZA", { dateStyle: "medium" })}` : ""}</small></span>
            <span className="role-list">{user.roles.length ? user.roles.map((role) => <span className="chip" key={role}>{role.replaceAll("_", " ")}</span>) : <span className="chip">no roles</span>}</span></summary>
          {user.id === person.id ? <p className="muted">You cannot change your own roles. Ask another administrator.</p> : user.active ? <RoleForm id={user.id} version={user.version} roles={user.roles} canGrantSuper={isSuper} /> : <p className="muted">This account is inactive.</p>}
          {open === user.id && history.length > 0 && <div><h3>Recent changes</h3>{history.map((entry, index) => <p key={index} className="muted">{new Date(entry.created_at).toLocaleDateString("en-ZA", { dateStyle: "medium" })} · {entry.actor}: {entry.previous_roles.join(", ") || "none"} → {entry.assigned_roles.join(", ")} ({entry.reason})</p>)}</div>}
        </details>) : <Empty>No users yet.</Empty>}
      </Panel>
    </>;
  }}</Workspace>;
}
