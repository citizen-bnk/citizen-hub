import { Suspense, type ReactNode } from "react";
import { useRouteError } from "react-router-dom";
import { websiteUrl } from "../config";

/** Session reads can suspend before the authenticated shell exists. */
export function SessionBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main role="status" aria-live="polite" className="flex min-h-screen items-center justify-center p-6"><p>Opening Citizen Hub securely…</p></main>}>{children}</Suspense>;
}

export function ApplicationRecovery({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "";
  const chunk = /dynamically imported module|Loading chunk|module script/i.test(message);
  const session = /426|synchronous input/i.test(message);
  const title = chunk ? "The screen download failed" : session ? "Your session was interrupted while loading" : "Citizen Hub could not open this screen";
  return <main role="alert" className="mx-auto max-w-xl px-4 py-20"><div className="rounded-xl border bg-card p-6">
    <h1 className="text-xl font-semibold">{title}</h1>
    <p className="mt-3 text-sm text-muted-foreground">{chunk ? "The browser could not download the current screen code. Retry to load the latest release." : session ? "Authentication was still loading when the screen changed. Retry to restore your session." : "A screen error interrupted this request. Retry, return to the previous page, or cancel and open the Citizen Bank website."}</p>
    <p className="mt-2 text-xs text-muted-foreground">Issue: {chunk ? "SCREEN_DOWNLOAD" : session ? "SESSION_LOADING" : "SCREEN_FAILURE"}</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <button className="rounded-lg border px-3 py-2" onClick={() => window.location.reload()}>Retry</button>
      <button className="rounded-lg border px-3 py-2" onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/login")}>Go back</button>
      <a className="rounded-lg border px-3 py-2" href={websiteUrl("/")}>Cancel · Citizen Bank website</a>
    </div>
  </div></main>;
}

export function RouteRecovery() {
  return <ApplicationRecovery error={useRouteError()} />;
}
