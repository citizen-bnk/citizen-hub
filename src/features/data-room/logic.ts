import { z } from "zod";
import { policy } from "@/platform/policy/current";

/** The three agreements that unlock the data room, in the order they are signed. `key` is the backend's agreement_type. */
export const AGREEMENTS = [
  { key: "ncnda", label: "Non-circumvention and non-disclosure agreement (NCNDA)", short: "NCNDA" },
  { key: "terms", label: "Data room terms and conditions", short: "Terms" },
  { key: "letter_of_intent", label: "Letter of intent (LOI)", short: "Letter of intent" },
] as const;
export type AgreementKey = (typeof AGREEMENTS)[number]["key"];

export type MyStatus = {
  ncnda_signed: boolean; ncnda_signed_at: string | null;
  terms_signed: boolean; terms_signed_at: string | null;
  loi_agreed: boolean; loi_agreed_at: string | null;
  loi_file_url: string | null; loi_status: string | null;
};

export type AgreementRow = { key: AgreementKey; label: string; short: string; signed: boolean; signedAt: string | null; review: string | null };

/** One row per agreement with whether it is signed, when, and (for the LOI) where the office review stands. */
export function agreementRows(s: MyStatus): AgreementRow[] {
  const by: Record<AgreementKey, [boolean, string | null]> = {
    ncnda: [s.ncnda_signed, s.ncnda_signed_at],
    terms: [s.terms_signed, s.terms_signed_at],
    letter_of_intent: [s.loi_agreed, s.loi_agreed_at],
  };
  return AGREEMENTS.map((a) => ({
    ...a, signed: by[a.key][0], signedAt: by[a.key][1],
    review: a.key === "letter_of_intent" && by[a.key][0] ? s.loi_status : null,
  }));
}

export const unsigned = (rows: AgreementRow[]) => rows.filter((r) => !r.signed);

/** Plain-words state of the person's access, for the strip and the Home tile. */
export function accessSummary(rows: AgreementRow[], hasAccess: boolean): { tone: "good" | "warn" | "bad"; text: string } {
  const left = unsigned(rows);
  if (!hasAccess) return { tone: "warn", text: `${left.length} of ${rows.length} agreements still to sign` };
  const loi = rows.find((r) => r.key === "letter_of_intent");
  if (loi?.review === "rejected") return { tone: "bad", text: "Access is open, but your letter of intent was not accepted. Contact the office." };
  if (loi?.review === "pending") return { tone: "good", text: "Access granted. Your letter of intent is awaiting review." };
  return { tone: "good", text: "Access granted" };
}

// --- investor forms

export const signatureSchema = z.string().trim().min(2, "Type your full name to sign").max(120, "Name is too long");
const money = z.string().trim().refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) > 0), "Enter an amount above zero");
const email = z.string().trim().refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email address");

export const loiSchema = z.object({
  investor_name: z.string().trim().min(2, "Enter the investor's name"),
  entity_name: z.string().trim(),
  entity_type: z.string().trim(),
  registration_number: z.string().trim(),
  investment_amount: money,
  investment_currency: z.string().trim().length(3, "Use a 3-letter currency code"),
  contact_email: email,
  contact_phone: z.string().trim(),
  investment_purpose: z.string().trim(),
});
export type LoiForm = z.infer<typeof loiSchema>;
/** The wording shown when the backend has no current text for an agreement (or cannot be reached). */
export const FALLBACK_TEXT: Record<Exclude<AgreementKey, "ncnda">, string> = {
  terms: "I accept the terms and conditions for using the data room: the documents are confidential, are for my own evaluation of an investment, and every time I open one is recorded.",
  letter_of_intent: "I confirm my intention to invest and give the details below so the office can review them.",
};

export const emptyLoi = (): LoiForm => ({
  investor_name: "", entity_name: "", entity_type: "", registration_number: "", investment_amount: "",
  investment_currency: policy("app.base_currency"), contact_email: "", contact_phone: "", investment_purpose: "",
});

/** The letter of intent starts from the person's profile, so nothing they already told us is typed again. Still editable. */
export function loiFromProfile(p: Partial<Record<string, unknown>> | null | undefined): LoiForm {
  const text = (k: string) => (typeof p?.[k] === "string" ? (p[k] as string) : "");
  return {
    ...emptyLoi(),
    investor_name: text("full_name"), contact_email: text("email"), contact_phone: text("phone"),
    entity_name: text("business_name"), registration_number: text("company_registration_number"), investment_purpose: text("investment_purpose"),
  };
}

/** First message per field of a zod failure, or {} when valid. */
export function fieldErrors(result: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const i of result.error.issues) out[String(i.path[0] ?? "_")] ??= i.message;
  return out;
}

export const reasonSchema = z.string().trim().min(5, "Say briefly why you are opening this document (at least 5 characters)");

// --- documents

export type DocLike = { id: number; category_id: number | null; category_name: string | null };

/** Documents grouped by category in the order first met (the backend sorts by the category's display order). */
export function groupByCategory<T extends DocLike>(docs: readonly T[]): { name: string; docs: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const d of docs) {
    const k = d.category_name ?? "Other";
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  return [...groups].map(([name, list]) => ({ name, docs: list }));
}

export function matches(d: { document_name: string; description: string | null; category_name: string | null }, search: string, category: string): boolean {
  if (category && (d.category_name ?? "Other") !== category) return false;
  const q = search.trim().toLowerCase();
  return !q || `${d.document_name} ${d.description ?? ""}`.toLowerCase().includes(q);
}

export function fileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** The backend returns either a full link or a storage key; a key is fetched through the file route and saved under a proper name. */
export function fileTarget(fileUrl: string, documentName: string): { kind: "link"; url: string } | { kind: "key"; key: string; name: string } {
  if (/^https?:\/\//i.test(fileUrl)) return { kind: "link", url: fileUrl };
  const ext = fileUrl.includes(".") ? fileUrl.slice(fileUrl.lastIndexOf(".")) : "";
  return { kind: "key", key: fileUrl, name: `${documentName.replace(/[^\w\- ]+/g, "").trim() || "document"}${ext}` };
}

export const categorySchema = z.object({
  category_name: z.string().trim().min(2, "Enter a category name"),
  description: z.string().trim(),
  display_order: z.string().trim().refine((v) => /^\d+$/.test(v), "Use a whole number, 0 or more"),
});

export const uploadSchema = z.object({
  document_name: z.string().trim().min(2, "Enter a document name"),
  version: z.string().trim().min(1, "Enter a version, e.g. 1.0").regex(/^[\w.\-]+$/, "Letters, numbers and dots only"),
});

/** All problems with a signing attempt, keyed by field; {} means it may be sent. */
export function signingErrors(signature: string, keys: readonly AgreementKey[], loi: LoiForm): Record<string, string> {
  const errors = fieldErrors(signatureSchema.safeParse(signature));
  if (errors._) errors.signature = errors._;
  delete errors._;
  return keys.includes("letter_of_intent") ? { ...errors, ...fieldErrors(loiSchema.safeParse(loi)) } : errors;
}

/** "1.0" becomes "1.1"; any other style of version is left for the person to edit. */
export const nextVersion = (v: string) => (/^\d+\.\d+$/.test(v) ? `${v.split(".")[0]}.${Number(v.split(".")[1]) + 1}` : v);

/** A user id shortened for tables (the audit routes return ids, not names). */
export const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

export const agreementLabel = (type: string) => AGREEMENTS.find((a) => a.key === type)?.short ?? type;
