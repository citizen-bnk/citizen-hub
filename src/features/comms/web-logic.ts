import type { FieldDef } from "./logic";
import type { AdvertBody, NewsletterBody, SectionBody, Visibility } from "./web";

/** Pure rules for the newsletter and careers editors: form fields, line lists, the upload cap and the publish wording. */

export const MAX_PDF_BYTES = 4 * 1024 * 1024;

export const NEWSLETTER_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true, max: 200 },
  { name: "series", label: "Series", required: true, max: 80, hint: "For example Monthly or Quarterly Review." },
  { name: "issue_no", label: "Issue number", type: "number" },
  { name: "published_on", label: "Date", type: "date" },
  { name: "period_label", label: "Period", hint: "For example October 2026." },
  { name: "summary", label: "Summary", type: "textarea" },
  { name: "external_url", label: "External link", type: "url", hint: "Where the issue is kept when the PDF is too big to upload." },
];

export const ADVERT_FIELDS: FieldDef[] = [
  { name: "title", label: "Job title", required: true, max: 200 },
  { name: "department", label: "Department" },
  { name: "employment_type", label: "Type", hint: "For example Full-time, Part-time or Contract." },
  { name: "location", label: "Location" },
  { name: "summary", label: "Summary", type: "textarea" },
  { name: "how_to_apply", label: "How to apply", type: "textarea" },
  { name: "closing_date", label: "Closing date", type: "date" },
];

/** A section as typed: its points one per line. */
export type SectionDraft = { heading: string; points: string };

/** One item per line, blanks dropped. */
export const toLines = (text: string): string[] => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
export const linesText = (lines: unknown): string => (Array.isArray(lines) ? lines.filter((l) => typeof l === "string").join("\n") : "");

export function toDrafts(raw: unknown): SectionDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): SectionDraft[] => {
    if (typeof r === "string") return [{ heading: r, points: "" }];
    if (!r || typeof r !== "object") return [];
    const o = r as { heading?: unknown; title?: unknown; points?: unknown };
    return [{ heading: String(o.heading ?? o.title ?? ""), points: linesText(o.points) }];
  });
}
/** Sections with nothing in them are dropped. */
export const fromDrafts = (drafts: readonly SectionDraft[]): SectionBody[] =>
  drafts.map((d) => ({ heading: d.heading.trim(), points: toLines(d.points) })).filter((s) => s.heading || s.points.length);

/** The newsletter body: the simple fields plus the sections. An empty issue number is no number (not 0). */
export const newsletterBody = (fields: Record<string, string | number | null>, drafts: readonly SectionDraft[]): NewsletterBody => ({
  ...(fields as Omit<NewsletterBody, "sections" | "issue_no">),
  issue_no: Number(fields.issue_no) > 0 ? Number(fields.issue_no) : null,
  sections: fromDrafts(drafts),
});

export const advertBody = (fields: Record<string, string | number | null>, responsibilities: string, requirements: string): AdvertBody => ({
  ...(fields as Omit<AdvertBody, "responsibilities" | "requirements">),
  responsibilities: toLines(responsibilities),
  requirements: toLines(requirements),
});

/** A message when the PDF cannot be uploaded, otherwise null. */
export function fileProblem(file: { name: string; size: number; type?: string }): string | null {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return "Choose a PDF file.";
  if (file.size > MAX_PDF_BYTES) return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files over 4 MB cannot be uploaded here: keep the PDF elsewhere and put its link in "External link".`;
  return null;
}

export const VISIBILITIES: { value: Visibility; label: string; who: string }[] = [
  { value: "public", label: "Public", who: "Anyone who visits the Citizen Bank website will be able to read it, signed in or not." },
  { value: "members", label: "Members", who: "Everyone signed in to the Hub (investors, board members and staff) will see it under Newsletters. It will not be on the public website." },
  { value: "internal", label: "Internal", who: "Only staff will see it. Investors and board members will not." },
];
export const whoSees = (v: Visibility) => VISIBILITIES.find((x) => x.value === v)?.who ?? "";

/** What the super admin confirms before an advert goes live: the legal position of the company must not be misstated. */
export const WORDING_CONFIRMATION = "I have checked this advert's wording: it does not describe Citizen Bank as an existing licensed bank.";

/** Who may publish an advert: the super admin only. */
export const canPublishAdvert = (roles: readonly string[]) => roles.includes("super_admin");
/** Who may publish or unpublish a newsletter: the back office and the super admin, as the backend allows. */
export const canPublishNewsletter = (roles: readonly string[]) => roles.some((r) => r === "super_admin" || r === "back_office");

export const advertActions = (status: string) => ({ publish: status === "draft", close: status === "published" });
export const newsletterActions = (status: string) => ({ publish: status === "draft", unpublish: status === "published" });
