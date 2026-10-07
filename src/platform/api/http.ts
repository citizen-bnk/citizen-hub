import { auth } from "../auth/token";
import { ApiError, fromResponse, networkError } from "./errors";

export type Query = Record<string, string | number | boolean | null | undefined>;
export type RequestOptions = { query?: Query; body?: unknown; signal?: AbortSignal };

const base = () => `${window.location.origin}/api`;

function url(path: string, query?: Query): string {
  const u = new URL(`${base()}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  return u.toString();
}

async function send(method: string, path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = await auth.getAuthHeaderValue();
  if (token) headers.Authorization = token;
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body; // the browser sets the multipart boundary
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(url(path, opts.query), { method, headers, body, signal: opts.signal, credentials: "include", cache: "no-store" });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw networkError();
  }
  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      /* not JSON: the status alone decides the message */
    }
    throw fromResponse(res.status, payload);
  }
  return res;
}

/** JSON in, JSON out. Throws ApiError, never returns an error value. */
async function json<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(method, path, opts);
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError("server", "The server sent a reply we could not read.", res.status);
  }
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => json<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) => json<T>("POST", path, { body, query }),
  put: <T>(path: string, body?: unknown, query?: Query) => json<T>("PUT", path, { body, query }),
  patch: <T>(path: string, body?: unknown, query?: Query) => json<T>("PATCH", path, { body, query }),
  delete: <T = void>(path: string, query?: Query) => json<T>("DELETE", path, { query }),
  /** A file from the backend (PDF, image...). Returns the bytes and the suggested file name. */
  file: async (path: string, query?: Query): Promise<{ blob: Blob; name: string }> => {
    const res = await send("GET", path, { query });
    const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(res.headers.get("content-disposition") ?? "");
    return { blob: await res.blob(), name: m ? decodeURIComponent(m[1]) : "download" };
  },
};

/** Saves a downloaded file through the browser. */
export function saveFile({ blob, name }: { blob: Blob; name: string }): void {
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
