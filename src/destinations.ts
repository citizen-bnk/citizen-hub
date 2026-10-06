import { canOpen } from "@citizen-bnk/platform";

export type Destination = { label: string; path: string; description: string };

const DESTINATIONS: (Destination & { roles: string[] })[] = [
  { roles: ["super_admin", "admin"], label: "Administration", path: "/admin-dashboard",
    description: "Users, roles, suspension and the audit trail" },
  { roles: ["staff", "back_office", "super_admin"], label: "Back office", path: "/back-office-dashboard",
    description: "Payments, documents, invitations, the data room and licensing" },
  { roles: ["board_member"], label: "Board portal", path: "/board-portal",
    description: "Board papers, meetings and votes" },
  { roles: ["investor", "shareholder"], label: "My investments", path: "/my-subscriptions",
    description: "Subscriptions, proof of payment, receipts and certificates" },
];

/** The Hub workspaces a person's roles open, in the order they should be offered. Nobody without Hub access gets any. */
export function destinationsFor(roles: readonly string[]): Destination[] {
  if (!canOpen("hub", roles)) return [];
  const held = new Set(roles);
  return DESTINATIONS.filter((d) => d.roles.some((r) => held.has(r))).map(({ label, path, description }) => ({ label, path, description }));
}

/** Where a workspace opens. Only a plain path is ever joined to the website address. */
export function workspaceUrl(websiteUrl: string, path: string): string {
  return `${websiteUrl.replace(/\/+$/, "")}${path.startsWith("/") && !path.startsWith("//") ? path : "/"}`;
}
