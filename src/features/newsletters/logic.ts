import type { Newsletter, Section } from "./api";

/** Pure rules for the members' newsletter library. */

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Sections as the backend stores them (a list of {heading, points}); anything else is read as far as it makes sense. */
export function sectionsOf(raw: unknown): Section[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): Section[] => {
    if (typeof r === "string") return str(r) ? [{ heading: str(r), points: [] }] : [];
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    const points = (Array.isArray(o.points) ? o.points : Array.isArray(o.items) ? o.items : []).map(str).filter(Boolean);
    const heading = str(o.heading) || str(o.title);
    return heading || points.length ? [{ heading, points }] : [];
  });
}

export type Access =
  | { kind: "file" }
  | { kind: "link"; url: string }
  | { kind: "none" };

/** How a member gets to the issue: the uploaded PDF, else the external link, else it is not available yet. */
export function accessOf(n: Pick<Newsletter, "has_file" | "external_url">): Access {
  if (n.has_file) return { kind: "file" };
  const url = str(n.external_url);
  return /^https?:\/\//i.test(url) ? { kind: "link", url } : { kind: "none" };
}

/** Newest first; issues without a date go last. */
export const newestFirst = <T extends Pick<Newsletter, "published_on" | "issue_no">>(rows: readonly T[]): T[] =>
  [...rows].sort((a, b) => (b.published_on ?? "").localeCompare(a.published_on ?? "") || (b.issue_no ?? 0) - (a.issue_no ?? 0));

/** "Issue 5 · Monthly", the line under the title. */
export const issueLine = (n: Pick<Newsletter, "series" | "issue_no" | "period_label">) =>
  [n.issue_no ? `Issue ${n.issue_no}` : "", n.series, n.period_label ?? ""].filter(Boolean).join(" · ");

/** A readable file name for a download, when the server did not send one. */
export const pdfName = (n: Pick<Newsletter, "slug" | "title">) => `${(n.slug || n.title).replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "newsletter"}.pdf`;
