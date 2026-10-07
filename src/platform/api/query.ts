import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, asApiError } from "./errors";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    queryMeta: {
      /** Show nothing when this query fails (the screen renders its own state). */
      silent?: boolean;
    };
    mutationMeta: {
      /** Said once when the action succeeds. */
      success?: string;
      /** Show nothing when this action fails (the form shows field errors itself). */
      silent?: boolean;
    };
  }
}

let onSignedOut: () => void = () => {};
/** The app tells the client what to do when the backend says the session is over. */
export const setSignedOutHandler = (fn: () => void) => (onSignedOut = fn);

/**
 * THE place errors are reported. No screen has its own try/catch + toast: a query or action that fails lands here, which
 * says what went wrong once, and ends the session cleanly when the backend says it is over.
 */
function report(error: unknown, silent?: boolean) {
  const e = asApiError(error);
  if (e.kind === "unauthenticated") return onSignedOut();
  if (!silent) toast.error(e.message);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      // A query that already shows data keeps it; only report when the person has nothing to look at, or a background refresh fails.
      onError: (error, query) => report(error, query.meta?.silent),
    }),
    mutationCache: new MutationCache({
      onError: (error, _v, _c, mutation) => report(error, mutation.meta?.silent),
      onSuccess: (_d, _v, _c, mutation) => {
        if (mutation.meta?.success) toast.success(mutation.meta.success);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry only what can succeed on a second try: a lost connection or a server hiccup, twice at most.
        retry: (count, error) => count < 2 && ["network", "server"].includes(asApiError(error).kind),
      },
    },
  });
}
