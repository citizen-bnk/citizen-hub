import { z } from "zod";

/** Pure rules for the licence-document screens: progress, status, validation. */

export type DocState = "missing" | "under_review" | "approved" | "rejected" | "expired";

type Item = {
  is_required: boolean;
  is_complete: boolean;
  requirement: { name: string };
  submission?: { status: string } | null;
};

/** Where one requirement stands for a member, in the words the screen shows. */
export function docState(item: Pick<Item, "submission">): DocState {
  const s = item.submission?.status;
  if (!s || s === "not_submitted") return "missing";
  if (s === "approved") return "approved";
  if (s === "expired") return "expired";
  if (s === "rejected" || s === "resubmission_required") return "rejected";
  return "under_review"; // submitted, under_review
}

/** A member may upload when nothing is on file, or when the file was rejected or expired; never while it is being reviewed or approved. */
export const canUpload = (item: Pick<Item, "submission">) => ["missing", "rejected", "expired"].includes(docState(item));

/** Resubmit (replace the file) when a submission exists; first upload otherwise. */
export const needsResubmit = (item: Pick<Item, "submission">) => docState(item) !== "missing";

export type Progress = { required: number; approved: number; underReview: number; needsAction: number; percent: number; missing: string[] };

/** Overall progress: only required documents count; percent is approved over required. */
export function progress(items: readonly Item[]): Progress {
  const req = items.filter((i) => i.is_required);
  const states = req.map(docState);
  const approved = states.filter((s) => s === "approved").length;
  const underReview = states.filter((s) => s === "under_review").length;
  return {
    required: req.length,
    approved,
    underReview,
    needsAction: req.length - approved - underReview,
    percent: req.length === 0 ? 100 : Math.round((approved / req.length) * 100),
    missing: req.filter((i) => ["missing", "rejected", "expired"].includes(docState(i))).map((i) => i.requirement.name),
  };
}

export type MemberReadiness = "complete" | "in_progress" | "not_started" | "needs_attention";

/** Members with a rejected document need attention first; otherwise by how much has been approved. */
export function readiness(m: { total_required: number; total_submitted: number; total_approved: number; total_rejected: number }): MemberReadiness {
  if (m.total_rejected > 0) return "needs_attention";
  if (m.total_required > 0 && m.total_approved >= m.total_required) return "complete";
  if (m.total_submitted === 0) return "not_started";
  return "in_progress";
}

export const JURISDICTIONS = ["global", "lesotho", "south_africa", "botswana"] as const;
export const SEVERITIES = ["critical", "urgent", "important", "normal", "info"] as const;

/** The requirement editor's form; blank validity means the document never expires. */
export const requirementSchema = z.object({
  name: z.string().trim().min(2, "Give the document a name"),
  description: z.string().trim().optional(),
  jurisdictions: z.array(z.enum(JURISDICTIONS)).min(1, "Choose at least one jurisdiction"),
  is_required: z.boolean(),
  requires_template: z.boolean(),
  validity_period_days: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int("Whole days only").positive("Must be more than 0").nullable(),
  ),
  display_order: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0)),
  default_severity: z.enum(SEVERITIES),
});
export type RequirementForm = z.input<typeof requirementSchema>;

/** First message per field, ready for <Field error=...>. */
export function fieldErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** A rejection must say why, so the member knows what to fix. */
export const rejectionReason = (s: string): string | null => (s.trim().length < 3 ? "Say what is wrong with the document" : null);
