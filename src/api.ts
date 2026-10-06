/** Calls to the website's platform API (reached through this site's own /api, which Vercel forwards to the website). */
export type Me = { person_id: string; display_name: string | null; email: string | null; roles: string[]; demo_mode: boolean };
export type ServiceInfo = { id: string; name: string; url: string | null; eligible: boolean; reason?: string | null };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function apiGet<T>(path: string, authorization: string, fetchImpl: typeof fetch = fetch): Promise<T> {
  const res = await fetchImpl(`/api/platform${path}`, {
    headers: { Accept: "application/json", Authorization: authorization },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = typeof j?.detail === "string" ? j.detail : "";
    } catch { /* not JSON */ }
    throw new ApiError(detail || `Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}
