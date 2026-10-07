import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { asApiError } from "../api/errors";

/**
 * The only way a screen shows loading, failure and emptiness. Give it the query and what to draw when there is data:
 *
 *   <PageState query={q} empty="No meetings yet">{(rows) => <Table rows={rows} />}</PageState>
 *
 * A failed query shows a message and a retry button here; the toast for it is raised once by the query client.
 */
export function PageState<T>({
  query, children, empty, isEmpty = (d) => Array.isArray(d) && d.length === 0,
}: {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "error" | "refetch" | "isFetching">;
  children: (data: T) => ReactNode;
  /** Shown instead of the children when the data is an empty list (or `isEmpty` says so). */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
}) {
  if (query.isPending) return <Centered><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> <span>Loading…</span></Centered>;
  if (query.isError) {
    return (
      <Centered role="alert">
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
        <span>{asApiError(query.error).message}</span>
        <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50">
          Try again
        </button>
      </Centered>
    );
  }
  if (empty !== undefined && isEmpty(query.data as T)) return <Centered><Inbox className="h-5 w-5" aria-hidden /> <span>{empty}</span></Centered>;
  return <>{children(query.data as T)}</>;
}

function Centered({ children, role }: { children: ReactNode; role?: "alert" }) {
  return (
    <div role={role} className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
