/**
 * The one error type the Hub throws for anything that goes wrong talking to the backend.
 * Screens never catch it to show a message: the query client reports it once, in one place (see query.ts), and a screen
 * only decides what to render while it is loading, failed or empty (see ui/PageState).
 */
export type ErrorKind = "network" | "unauthenticated" | "forbidden" | "not_found" | "invalid" | "conflict" | "server" | "unknown";

export class ApiError extends Error {
  constructor(
    readonly kind: ErrorKind,
    /** Safe to show to the person using the Hub. */
    message: string,
    readonly status = 0,
    /** Field-level problems from the backend, keyed by field name, when it sent them. */
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const kindFor = (status: number): ErrorKind =>
  status === 401 ? "unauthenticated"
  : status === 403 ? "forbidden"
  : status === 404 ? "not_found"
  : status === 409 ? "conflict"
  : status === 400 || status === 422 ? "invalid"
  : status >= 500 ? "server"
  : "unknown";

const FALLBACK: Record<ErrorKind, string> = {
  network: "We could not reach Citizen Bank. Check your connection and try again.",
  unauthenticated: "Your session has ended. Please sign in again.",
  forbidden: "Your account is not allowed to do this.",
  not_found: "We could not find what you asked for.",
  invalid: "Some of the information is not valid.",
  conflict: "This changed while you were working. Reload and try again.",
  server: "Something went wrong on our side. Please try again in a moment.",
  unknown: "Something went wrong. Please try again.",
};

/** FastAPI sends `{detail: string}` or `{detail: [{loc, msg}]}`; turn either into a message and per-field messages. */
export function fromResponse(status: number, body: unknown): ApiError {
  const kind = kindFor(status);
  const detail = (body as { detail?: unknown } | null)?.detail;
  const fields: Record<string, string> = {};
  let message: string | undefined;
  if (typeof detail === "string") message = detail;
  else if (Array.isArray(detail)) {
    for (const d of detail as { loc?: unknown[]; msg?: string }[]) {
      const field = String(d.loc?.[d.loc.length - 1] ?? "");
      if (field && d.msg) fields[field] = d.msg;
    }
    message = Object.values(fields)[0];
  }
  // A 5xx detail is for the logs, not for people; every other detail is written for them.
  return new ApiError(kind, kind === "server" || !message ? FALLBACK[kind] : message, status, fields);
}

export const networkError = () => new ApiError("network", FALLBACK.network);
export const asApiError = (e: unknown): ApiError => (e instanceof ApiError ? e : new ApiError("unknown", FALLBACK.unknown));
