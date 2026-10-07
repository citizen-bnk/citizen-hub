import { Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { features } from "@/features";
import { useSession } from "@/platform/auth/session";
import { startHandoff } from "@/platform/auth/handoff";
import { useAction } from "@/platform/ui/actions";
import { PageHeader, Panel } from "@/platform/ui/kit";
import { ScreenBoundary } from "@/platform/ui/ErrorBoundary";
import { SECTIONS } from "@/platform/feature";
import { landing, navFor, widgetsFor, workspaces } from "@/platform/registry";
import { lazy, useMemo } from "react";
import { websiteUrl } from "@/platform/config";

/** The role-aware landing page: your workspaces, then whatever each feature says needs your attention. */
export default function Home() {
  const session = useSession();
  const nav = navFor(features, session.roles);
  const spaces = workspaces(nav);
  const tiles = useMemo(
    () => widgetsFor(features, session.roles).map((w) => ({ id: `${w.feature.id}:${w.id}`, Tile: lazy(w.load) })),
    [session.roles],
  );
  const bank = useAction((audience: "banking" | "app") => startHandoff(audience), { onDone: (url) => window.location.assign(url) });
  const customer = session.roles.includes("customer");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`Welcome, ${session.name.split(" ")[0]}`} description="Here is where you can work and what needs your attention." />

      {spaces.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="workspaces">
          {spaces.map((n) => (
            <Link key={n.section} to={landing(n)} className="group rounded-xl border bg-card p-4 transition hover:border-primary">
              <div className="font-display text-base font-semibold">{SECTIONS[n.section].label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{SECTIONS[n.section].blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary-light">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      )}

      {customer && (
        <Panel title="Banking" className="mb-6">
          <p className="mb-3 text-sm text-muted-foreground">Your account is a banking account. Open banking from here; no sign-in again.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={bank.isPending} onClick={() => bank.mutate("banking")} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Internet Banking</button>
            <button type="button" disabled={bank.isPending} onClick={() => bank.mutate("app")} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">Citizen Bank App</button>
          </div>
        </Panel>
      )}

      {!session.loading && spaces.length === 0 && !customer && (
        <Panel title="No workspace yet">
          <p className="text-sm text-muted-foreground">Your account does not include a Hub workspace yet.</p>
          <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary-light" href={websiteUrl("/")}>Back to the Citizen Bank website <ArrowRight className="h-4 w-4" /></a>
        </Panel>
      )}

      {tiles.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2" data-testid="widgets">
          {tiles.map(({ id, Tile }) => (
            <ScreenBoundary key={id}>
              <Suspense fallback={null}><Tile /></Suspense>
            </ScreenBoundary>
          ))}
        </div>
      )}
    </div>
  );
}
