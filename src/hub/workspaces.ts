import { canOpen } from "@citizen-bnk/platform";

export type Workspace = { label: string; path: string; description: string; kind: "investor" | "board" | "staff"; external?: boolean };

const ALL: (Workspace & { roles: string[] })[] = [
  { roles: ["investor", "shareholder"], kind: "investor", label: "My investments", path: "/my-subscriptions",
    description: "Subscriptions, proof of payment, receipts and certificates" },
  { roles: ["board_member"], kind: "board", label: "Board portal", path: "/board-portal",
    description: "Board papers, meetings and votes" },
  { roles: ["staff", "back_office", "super_admin"], kind: "staff", label: "Back office", path: "/back-office-dashboard", external: true,
    description: "Payments, documents, invitations, the data room and licensing" },
  { roles: ["admin", "super_admin"], kind: "staff", label: "Administration", path: "/admin-dashboard", external: true,
    description: "Users, roles, suspension and the audit trail" },
];

/** The workspaces a person's roles open. Those not yet in the Hub (external) open on the website. */
export function workspacesFor(roles: readonly string[]): Workspace[] {
  if (!canOpen("hub", roles)) return [];
  const held = new Set(roles);
  return ALL.filter((w) => w.roles.some((r) => held.has(r))).map(({ roles: _r, ...w }) => w);
}
