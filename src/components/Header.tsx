import { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useUser } from "@stackframe/react";
import { stackClientApp } from "app/auth";
import { ExternalLink, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useUserRoles } from "utils/useUserRoles";
import { ThemeProviderContext } from "../internal-components/ThemeProvider";
import { NotificationBell } from "./NotificationBell";
import { WEBSITE_URL, websiteUrl } from "../hub/config";
import { workspacesFor } from "../hub/workspaces";

const BOARD_LINKS = [
  { label: "Meetings", path: "/board-meetings" },
  { label: "Documents", path: "/board-documents" },
];

/** The Hub's top bar: the Internet Banking look (translucent indigo, gradient wordmark), with the person's own workspaces. */
export function Header() {
  const user = useUser();
  const { roles } = useUserRoles();
  const { theme, setTheme } = useContext(ThemeProviderContext);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);

  const spaces = workspacesFor(roles);
  const links = [
    ...spaces.map((s) => ({ label: s.label, path: s.path, external: s.external })),
    ...(roles.includes("board_member") ? BOARD_LINKS : []),
  ];
  const name = user?.displayName || user?.primaryEmail || "Account";
  const dark = theme !== "light";

  const signOut = async () => {
    await stackClientApp.signOut(); // the session is shared with the website, so this signs out of both
    window.location.assign(WEBSITE_URL);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`;

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ background: "color-mix(in srgb, hsl(var(--background)) 80%, transparent)" }}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Citizen Hub home">
          <img src="/brand/logo-sm.webp" alt="" className="hidden h-9 w-auto sm:block" />
          <span className="font-display text-base sm:text-lg font-bold bg-clip-text text-transparent" style={{ backgroundImage: "var(--grad)" }}>
            Citizen Hub
          </span>
        </Link>

        <nav className="ml-3 hidden min-w-0 items-center gap-1 overflow-x-auto xl:flex" aria-label="Workspaces">
          {links.map((l) =>
            l.external ? (
              <a key={l.path} href={websiteUrl(l.path)} className={linkClass({ isActive: false })}>{l.label}</a>
            ) : (
              <NavLink key={l.path} to={l.path} className={linkClass}>{l.label}</NavLink>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <a
            href={websiteUrl("/")}
            className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground lg:flex"
          >
            Citizen Bank <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <NotificationBell />
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm transition hover:border-primary"
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white" style={{ backgroundImage: "var(--grad)" }}>
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-[10rem] truncate 2xl:block">{name}</span>
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-60 rounded-lg border bg-popover p-1 shadow-lg">
                <div className="break-words px-3 py-2 text-xs text-muted-foreground">{user?.primaryEmail}</div>
                <a role="menuitem" href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">Profile and settings</a>
                <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent xl:hidden"
            onClick={() => setMobile((m) => !m)}
            aria-label={mobile ? "Close menu" : "Open menu"}
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobile && (
        <nav className="border-t px-4 py-2 xl:hidden" aria-label="Workspaces">
          {links.map((l) => (
            <a key={l.path} href={l.external ? websiteUrl(l.path) : l.path} className="block rounded-lg px-3 py-3 text-sm hover:bg-accent">{l.label}</a>
          ))}
          <a href={websiteUrl("/")} className="block rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent">Citizen Bank website</a>
        </nav>
      )}
    </header>
  );
}

export default Header;
