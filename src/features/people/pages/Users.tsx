import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, DataTable, Status, type Column } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { date, label } from "@/platform/format";
import { allRoles, listUsers, searchUsers, type UserRow } from "../api";
import { UserDrawer } from "../components/UserDrawer";
import { withRole } from "../logic";

export default function Users() {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const roles = useQuery({ queryKey: ["people", "roles"], queryFn: allRoles, staleTime: 300_000 });
  const users = useQuery({
    queryKey: ["people", "users", term, status, page],
    queryFn: async () => {
      if (term) { const r = await searchUsers(term); return { users: r.users, total: r.total, total_pages: 1 }; }
      return listUsers({ page, status: status === "all" ? undefined : status });
    },
  });
  const search = (e: React.FormEvent) => { e.preventDefault(); setTerm(text.trim()); setPage(1); };

  const columns: Column<UserRow>[] = [
    { key: "who", header: "User", cell: (u) => <div><div className="font-medium">{u.full_name || "(no name)"}</div><div className="text-xs text-muted-foreground">{u.email}</div></div> },
    { key: "roles", header: "Roles", cell: (u) => <div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r} variant="secondary">{label(r)}</Badge>)}</div> },
    { key: "status", header: "Status", cell: (u) => <Status value={u.status} /> },
    { key: "joined", header: "Joined", className: "hidden md:table-cell", cell: (u) => date(u.created_at) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users and roles" description="Find a person, see what they can do, and change it." />
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={search} className="flex gap-2">
          <Input aria-label="Search users" placeholder="Name, email or phone" className="w-64" value={text} onChange={(e) => setText(e.target.value)} />
          <Button type="submit" variant="outline">Search</Button>
          {term && <Button type="button" variant="ghost" onClick={() => { setText(""); setTerm(""); }}>Clear</Button>}
        </form>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} disabled={!!term}>
          <SelectTrigger aria-label="Status" className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{["all", "active", "suspended", "pending"].map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : label(s)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger aria-label="Role" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {(roles.data ?? []).map((r) => <SelectItem key={r.id} value={r.role_name}>{label(r.role_name)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <PageState query={users} empty="No users found" isEmpty={(d) => d.users.length === 0}>
        {(d) => {
          const rows = withRole(d.users, role);
          return (
            <>
              {rows.length ? <DataTable rows={rows} columns={columns} rowKey={(u) => u.user_id} onRow={(u) => setOpenId(u.user_id)} /> : <p className="text-sm text-muted-foreground">No one on this page has that role.</p>}
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>{d.total} user(s)</span>
                {d.total_pages > 1 && (
                  <span className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    Page {page} of {d.total_pages}
                    <Button size="sm" variant="outline" disabled={page >= d.total_pages} onClick={() => setPage(page + 1)}>Next</Button>
                  </span>
                )}
              </div>
            </>
          );
        }}
      </PageState>
      <UserDrawer user={users.data?.users.find((u) => u.user_id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
}
