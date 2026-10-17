"use client";
import { useState } from "react";
import { useAct } from "./Act";
import { assignableRoles } from "@/lib/users-roles";

export function RoleForm({ id, version, roles, canGrantSuper }: { id: string; version: number; roles: string[]; canGrantSuper: boolean }) {
  const { act, busy, error } = useAct("/api/users");
  const [selected, setSelected] = useState<string[]>(roles);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const toggle = (role: string) => setSelected(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);
  const unchanged = selected.length === roles.length && selected.every((r) => roles.includes(r));
  return <form className="review-form" onSubmit={(event) => { event.preventDefault(); void act({ action: "roles", id, roles: selected, version, reason, confirmed: true }); }}>
    <fieldset className="role-grid"><legend>Roles</legend>
      {assignableRoles.map((role) => <label key={role} className="consent"><input type="checkbox" checked={selected.includes(role)} disabled={role === "super_admin" && !canGrantSuper} onChange={() => toggle(role)} />{role.replaceAll("_", " ")}</label>)}
    </fieldset>
    <label>Reason (recorded with the change)<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} /></label>
    <label className="consent"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I understand this changes what this person can see and do, and signs them out of their other sessions.</label>
    {error && <div role="alert" className="form-error">{error}</div>}
    <button className="button primary" disabled={busy || unchanged || !selected.length || reason.trim().length < 8 || !confirmed}>{busy ? "Saving…" : "Change roles"}</button>
  </form>;
}
