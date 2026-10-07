import { Bell as BellIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnreadCount } from ".";

/** The bell in the top bar: a number, never a pop-up. It leads to the inbox. */
export function Bell() {
  const unread = useUnreadCount().data ?? 0;
  return (
    <Link to="/notifications" className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
      <BellIcon className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white" style={{ backgroundImage: "var(--grad)" }} data-testid="unread-badge">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
