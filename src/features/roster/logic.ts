import { z } from "zod";

/** Pure rules for the board roster: status words, filters, validation. */

type Member = {
  user_id: string | null;
  full_name: string;
  email: string;
  position_name: string | null;
  status: string | null;
  investment_status: { meets_requirement: boolean } | null;
  document_compliance: { compliance_percentage: number } | null;
};

export type InvestmentState = "met" | "short" | "none";

/** `none` when the position has no share requirement (or the member has no position yet). */
export const investmentState = (m: Pick<Member, "investment_status">): InvestmentState =>
  !m.investment_status ? "none" : m.investment_status.meets_requirement ? "met" : "short";

export type DocState = "complete" | "partial" | "none" | "unknown";
export const docState = (m: Pick<Member, "document_compliance">): DocState => {
  const p = m.document_compliance?.compliance_percentage;
  return p === undefined ? "unknown" : p >= 100 ? "complete" : p > 0 ? "partial" : "none";
};

/** A member record with no real sign-in behind it: no user, or the placeholder the backend creates before first login. */
export const needsLink = (m: { user_id: string | null; email?: string }, unmapped?: ReadonlySet<string>) =>
  !m.user_id || m.user_id.startsWith("pending_") || (!!m.email && !!unmapped?.has(m.email.toLowerCase()));

export const FILTERS = [
  { id: "all", label: "All" },
  { id: "link", label: "Needs account link" },
  { id: "shares", label: "Shares short" },
  { id: "docs", label: "Documents incomplete" },
  { id: "inactive", label: "Not active" },
] as const;
export type FilterId = (typeof FILTERS)[number]["id"];

export function filterMembers<M extends Member>(members: readonly M[], filter: FilterId, query: string, unmapped?: ReadonlySet<string>): M[] {
  const q = query.trim().toLowerCase();
  return members.filter((m) => {
    if (q && !`${m.full_name} ${m.email} ${m.position_name ?? ""}`.toLowerCase().includes(q)) return false;
    switch (filter) {
      case "link": return needsLink(m, unmapped);
      case "shares": return investmentState(m) === "short";
      case "docs": return docState(m) !== "complete";
      case "inactive": return m.status !== "active";
      default: return true;
    }
  });
}

/** Whole days from `now` to the end of the term; negative once it has ended, null with no end date. */
export function termDaysLeft(termEnd: string | null | undefined, now = new Date()): number | null {
  if (!termEnd) return null;
  const end = new Date(termEnd).getTime();
  return Number.isNaN(end) ? null : Math.ceil((end - now.getTime()) / 86_400_000);
}

/** "Ends in 3 months", "Ended 2 weeks ago" style wording for a term. */
export function termWords(days: number | null): string {
  if (days === null) return "No end date";
  const n = Math.abs(days);
  const span = n >= 60 ? `${Math.round(n / 30)} months` : n >= 14 ? `${Math.round(n / 7)} weeks` : `${n} day${n === 1 ? "" : "s"}`;
  return days < 0 ? `Ended ${span} ago` : days === 0 ? "Ends today" : `${span} left`;
}

/** The position names the backend accepts when appointing (back_office_board appoint). */
export const APPOINT_POSITIONS = [
  { value: "chairman", label: "Chairman" },
  { value: "vice_chairman", label: "Vice chairman" },
  { value: "director", label: "Director" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "member", label: "Member" },
] as const;

export const appointSchema = z.object({
  user_id: z.string().min(1, "Choose a person"),
  position: z.enum(["chairman", "vice_chairman", "director", "secretary", "treasurer", "member"], { errorMap: () => ({ message: "Choose a position" }) }),
  term_years: z.preprocess((v) => Number(v), z.number().int().min(1, "At least 1 year").max(6, "At most 6 years")),
});

export const editSchema = z.object({
  position: z.string().optional(),
  term_end_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a date").optional(),
  status: z.enum(["active", "inactive", "resigned", "removed"]),
});

export const positionSchema = z.object({
  position_name: z.string().trim().min(2, "Give the position a name").max(100),
  position_level: z.preprocess((v) => Number(v), z.number().int("Whole number").min(1, "1 is the highest rank")),
  description: z.string().trim().optional(),
});

export const assignSchema = z.object({
  member_id: z.string().min(1, "Choose a member"),
  position_id: z.string().min(1, "Choose a position"),
  term_end_date: z.string().optional(),
  notes: z.string().optional(),
}).refine((v) => !v.term_end_date || v.term_end_date > new Date().toISOString().slice(0, 10), { path: ["term_end_date"], message: "The term must end in the future" });

/** First message per field for <Field error=...>. */
export function fieldErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** Shares held against the requirement, for the member's own tile. */
export function sharesLine(held: number, required: number | null | undefined): { text: string; met: boolean | null } {
  if (!required) return { text: `${held} shares held`, met: null };
  return held >= required
    ? { text: `${held} of ${required} shares: requirement met`, met: true }
    : { text: `${held} of ${required} shares: ${required - held} more needed`, met: false };
}
