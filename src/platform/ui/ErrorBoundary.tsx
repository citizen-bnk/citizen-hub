import type { ReactNode } from "react";
import { ErrorBoundary as Boundary, type FallbackProps } from "react-error-boundary";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function Fallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-lg font-semibold">This screen hit a problem</h1>
      <p className="mt-2 text-sm text-muted-foreground">The rest of the Hub still works. You can try this screen again or go back to the home page.</p>
      <div className="mt-4 flex justify-center gap-3">
        <button type="button" onClick={resetErrorBoundary} className="rounded-lg border px-3 py-2 text-sm hover:bg-accent">Try again</button>
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
