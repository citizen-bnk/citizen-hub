import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { dateTime } from "@/platform/format";
import type { Link as Dest } from "@/platform/notifications/logic";

/** A destination as a link: inside the Hub a router link, otherwise a plain address. */
export function Destination({ to, className, children }: { to: Dest | null | undefined; className?: string; children: React.ReactNode }) {
  if (!to) return <span className={className}>{children}</span>;
  return "to" in to ? <Link to={to.to} className={className}>{children}</Link> : <a href={to.href} className={className}>{children}</a>;
}

export function ItemRow({ title, body, at, unread, link, action }: { title: string; body?: string; at?: string; unread?: boolean; link?: Dest | null; action?: React.ReactNode }) {
  return (
    <li className={cn("flex items-start justify-between gap-3 px-3 py-3", unread && "bg-accent/40")}>
      <div className="min-w-0 text-sm">
        <Destination to={link} className={cn("font-medium", link && "text-primary-light hover:underline")}>{unread && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}{title}</Destination>
        {body && <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>}
        {at && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{dateTime(at)}</p>}
      </div>
      {action}
    </li>
  );
}
