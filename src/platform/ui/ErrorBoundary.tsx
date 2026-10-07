import type { ReactNode } from "react";
import { ErrorBoundary as Boundary, type FallbackProps } from "react-error-boundary";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function Fallback({ resetErrorBoundary, error }: FallbackProps) {
  const message = error instanceof Error ? error.message : "";
  const moduleFailure = /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(message);
  const transitionFailure = /Minified React error #426|synchronous input/i.test(message);
  return (
    <div role="alert" className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-lg font-semibold">{moduleFailure ? "This screen could not be loaded" : transitionFailure ? "This screen was interrupted while opening" : "This screen hit a problem"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{moduleFailure
        ? "The latest screen code could not be downloaded. Reload the page to fetch the current release."
        : transitionFailure
          ? "The page changed while its content was loading. Retry opens it through a safe transition."
          : "The rest of the Hub still works. Retry this screen or return to the home page."}</p>
      <div className="mt-4 flex justify-center gap-3">
        <button type="button" onClick={() => { if (moduleFailure) window.location.reload(); else resetErrorBoundary(); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-accent">Retry</button>
        <button type="button" onClick={() => window.history.back()} className="rounded-lg border px-3 py-2 text-sm hover:bg-accent">Go back</button>
        <a href="/" className="rounded-lg border px-3 py-2 text-sm hover:bg-accent">Home</a>
      </div>
    </div>
  );
}

/**
 * Wraps one screen: a code bug in it shows this panel instead of a blank page, and the shell around it stays usable.
 * It also supplies the loading state for lazily loaded screens. `resetKey` clears the panel when the person navigates.
 */
export function ScreenBoundary({ children, resetKey }: { children: ReactNode; resetKey?: string }) {
  return (
    <Boundary FallbackComponent={Fallback} resetKeys={[resetKey]} onError={(e) => console.error("[hub] screen crashed:", e)}>
      <Suspense fallback={<div className="flex justify-center p-16 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" /></div>}>
        {children}
      </Suspense>
    </Boundary>
  );
}
