/** Pure rules for turning backend notification rows into list items. */

export type RawNotification = {
  id: number;
  email_subject: string;
  email_content: string;
  email_type: string;
  read_status: boolean;
  created_at: string;
  metadata: { url?: unknown } | null;
};

export type Item = { id: number; title: string; body: string; kind: string; unread: boolean; at: string; link: Link | null };
export type Link = { to: string } | { href: string };

/** Notification bodies are email text, sometimes HTML: plain and short for a list. */
export function plain(s: string | null | undefined, max = 140): string {
  const t = (s ?? "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Where a notification leads. Only addresses on this site's own origins are followed: a relative path (a Hub screen, or an old
 * website address the Hub took over, via `resolve`) or an absolute address on the Hub or the website. Anything else is ignored,
 * so a notification can never send someone to a stranger's site. `website` is the website's origin and `hub` the Hub's.
 */
export function linkFor(
  url: unknown,
  ctx: { hub: string; website: string; resolve: (pathname: string, search: string, hash: string) => string | null; isHubPath: (pathname: string) => boolean },
): Link | null {
  if (typeof url !== "string" || !url.trim()) return null;
  let u: URL;
  try {
    u = new URL(url, ctx.hub);
  } catch {
    return null;
  }
  const own = [ctx.hub, ctx.website];
  if (url.startsWith("//") || !/^https?:$/.test(u.protocol) || !own.includes(u.origin)) return null;
  const moved = ctx.resolve(u.pathname, u.search, u.hash);
  if (moved) return { to: moved };
  if (ctx.isHubPath(u.pathname)) return { to: u.pathname + u.search + u.hash };
  return { href: `${ctx.website}${u.pathname}${u.search}${u.hash}` }; // a website page the Hub does not serve (invitation acceptance...)
}

export function toItem(n: RawNotification, link: (url: unknown) => Link | null): Item {
  return { id: n.id, title: plain(n.email_subject, 120), body: plain(n.email_content), kind: n.email_type, unread: !n.read_status, at: n.created_at, link: link(n.metadata?.url) };
}

/* ---------- the to-do list (Home) ---------- */

export type TodoItem = { id: string; title: string; body?: string; link?: Link; notificationId?: number };
export type TodoFeed = {
  profileMissing: boolean;
  invitations: { token: string; role: string; invited_by_name: string | null }[];
  unread: Item[];
};

const roleName = (r: string) => r.replace(/[_-]+/g, " ").toLowerCase();

/** One list from the same sources as the inbox: profile first, then invitations, then unread notifications. */
export function buildTodo(feed: TodoFeed): TodoItem[] {
  const items: TodoItem[] = [];
  if (feed.profileMissing) items.push({ id: "profile", title: "Complete your profile", body: "Tell us who you are to use the Hub.", link: { to: "/account/setup" } });
  for (const i of feed.invitations) {
    items.push({ id: `inv-${i.token}`, title: `Accept your invitation as ${roleName(i.role)}`, body: i.invited_by_name ? `Invited by ${i.invited_by_name}` : undefined, link: { to: "/invitations" } });
  }
  for (const n of feed.unread) {
    // The old "complete your profile" notification is the same job as the item above.
    if (feed.profileMissing && n.kind === "profile_completion") continue;
    items.push({ id: `n-${n.id}`, title: n.title, body: n.body, link: n.link ?? undefined, notificationId: n.id });
  }
  return items;
}
