import { useContext, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { stackClientApp } from "../auth/stack";
import { useSession } from "../auth/session";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { ThemeProviderContext } from "./ThemeProvider";
import { ScreenBoundary } from "./ErrorBoundary";
import { SECTIONS } from "../feature";
import { features } from "../../features";
import { type NavSection, landing, navFor } from "../registry";
import { WEBSITE_URL, websiteUrl } from "../config";
import { Bell } from "../notifications/Bell";
import { usePolicy } from "../policy";
import { cn } from "@/lib/utils";

/**
 * The frame around every screen: top bar, a side navigation built from the person's roles, the screen itself and one footer.
 * Screens draw only their own content; they never draw navigation, headers or footers.
 */
export function Shell() {
  const session = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const nav = navFor(features, session.roles);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar menuOpen={open} onMenu={() => setOpen((o) => !o)} />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <aside
          className={cn("w-64 shrink-0 border-r bg-background/60 p-3 lg:block", open ? "fixed inset-x-0 top-16 bottom-0 z-30 block w-full overflow-y-auto bg-background lg:static lg:w-64" : "hidden")}
          aria-label="Navigation"
        >
          <SideNav nav={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8" id="main">
          <ScreenBoundary resetKey={pathname}>
            <Outlet />
          </ScreenBoundary>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function SideNav({ nav, pathname, onNavigate }: { nav: NavSection[]; pathname: string; onNavigate: () => void }) {
  return (
    <nav className="space-y-1">
      {nav.map((n) => {
        const items = n.groups.flatMap((g) => g.items);
        const active = items.some((i) => pathname === i.screen.path || pathname.startsWith(i.screen.path.split("/:")[0] + "/"));
        if (n.section === "home") {
          return <NavItem key="home" to="/" onNavigate={onNavigate}>Home</NavItem>;
        }
        return (
          <details key={n.section} open={active || nav.length <= 3} className="group rounded-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent">
              <Link to={landing(n)} onClick={onNavigate} className="hover:text-foreground">{SECTIONS[n.section].label}</Link>
            </summary>
            <div className="mt-1 space-y-0.5 pl-1">
              {n.groups.map((g) => (
                <div key={g.group ?? "_"}>
                  {g.group && <div className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">{g.group}</div>}
                  {g.items.map((i) => <NavItem key={i.screen.path} to={i.screen.path} onNavigate={onNavigate} comingSoon={i.screen.comingSoon}>{i.screen.title}</NavItem>)}
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </nav>
  );
}

function NavItem({ to, children, onNavigate, comingSoon }: { to: string; children: React.ReactNode; onNavigate: () => void; comingSoon?: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      className={({ isActive }) => cn("block rounded-lg px-3 py-2 text-sm transition", isActive ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
    >
      <span className="flex items-center justify-between gap-2"><span>{children}</span>{comingSoon && <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Coming soon</span>}</span>
    </NavLink>
  );
}

function TopBar({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  const session = useSession();
  const { theme, setTheme } = useContext(ThemeProviderContext);
  const [menu, setMenu] = useState(false);
  const dark = theme !== "light";
  const signOut = async () => {
    await stackClientApp.signOut(); // the session is shared with the website, so this signs out of both
    window.location.assign(WEBSITE_URL);
  };
  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur" style={{ background: "color-mix(in srgb, hsl(var(--background)) 80%, transparent)" }}>
      <div className="flex h-16 items-center gap-3 px-4">
        <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden" onClick={onMenu} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2" aria-label="Citizen Hub home">
          <img src="/brand/logo-sm.webp" alt="" className="hidden h-9 w-auto sm:block" />
          <span className="font-display text-lg font-bold text-transparent bg-clip-text" style={{ backgroundImage: "var(--grad)" }}>Citizen Hub</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <a href={websiteUrl("/")} className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground md:block">Citizen Bank website</a>
          <Bell />
          <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}>
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm hover:border-primary" aria-haspopup="menu" aria-expanded={menu}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white" style={{ backgroundImage: "var(--grad)" }}>{session.name.slice(0, 1).toUpperCase()}</span>
              <span className="hidden max-w-[10rem] truncate xl:block">{session.name}</span>
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-60 rounded-lg border bg-popover p-1 shadow-lg">
                <div className="break-words px-3 py-2 text-xs text-muted-foreground">{session.email}</div>
                <Link role="menuitem" to="/account" onClick={() => setMenu(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-accent">Profile and settings</Link>
                <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const p = usePolicy().policies;
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {p["legal.footer"]}</p>
        <nav className="flex gap-4" aria-label="Legal">
          {[["Privacy", "/privacy-policy"], ["Terms", "/terms-of-service"], ["Disclosures", "/disclosures"], ["Contact", "/contact"]].map(([l, p]) => (
            <a key={p} href={websiteUrl(p)} className="hover:text-foreground">{l}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
