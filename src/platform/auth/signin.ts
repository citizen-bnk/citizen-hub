/** Helpers for signing in to the Hub. Pure, so they are tested without a browser. */

/** Added to the address we hand the website's sign-in, so coming back signed out (no shared session) is recognised. */
export const BOUNCE_PARAM = "hub_bounce";
/** Added when the Hub sends an address it does not own to the website, so the website does not send it straight back. */
export const FROM_HUB_PARAM = "from_hub";

export function withParam(href: string, name: string): string {
  const url = new URL(href);
  url.searchParams.set(name, "1");
  return url.href;
}

export function withoutParam(href: string, name: string): string {
  const url = new URL(href);
  url.searchParams.delete(name);
  return url.href;
}

/** The place to land after signing in: a path on the Hub, never another site. Anything else becomes "/". */
export function localReturn(raw: string | null | undefined, origin: string): string {
  if (!raw) return "/";
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
