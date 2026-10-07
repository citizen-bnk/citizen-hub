import { date, label } from "@/platform/format";
import type { Profile } from "@/platform/profile";
import { DEFAULT_LISTS, type ListItem } from "@/platform/policy/defaults";
import type { Field as Name, FormValues } from "./logic";

/**
 * The profile as six small sections. One definition drives the read-only view, the per-section editor and the first-time
 * setup form, so a field is described once: what it is called, how it looks, and whether it can be changed.
 */
export type FieldKey = Name | "email" | "id_number";
export type FieldSpec = {
  name: FieldKey;
  label: string;
  kind?: "text" | "date" | "tel" | "url" | "select";
  /** Name of the option list in the policy (gender, investor_type, account_type); the choices are data, not code. */
  list?: string;
  /** For a list that may be left unanswered: what the empty choice says. */
  blank?: string;
  /** Shown as a fixed value, never edited here, with this reason. */
  fixed?: string;
  wide?: boolean;
  hint?: string;
};
export type SectionId = "identity" | "contact" | "address" | "work" | "investor" | "business";
export type SectionSpec = { id: SectionId; title: string; blurb: string; fields: FieldSpec[] };

export type Lists = Record<string, readonly ListItem[]>;

/** The choices of a field: its policy list (the defaults until the backend answers), preceded by the empty choice when allowed. */
export function optionsFor(f: Pick<FieldSpec, "list" | "blank">, lists: Lists = DEFAULT_LISTS): [string, string][] {
  const rows = ((f.list && lists[f.list]) || []).map((i): [string, string] => [i.code, i.label]);
  return f.blank === undefined ? rows : [["", f.blank], ...rows];
}

export const SECTIONS: SectionSpec[] = [
  { id: "identity", title: "About you", blurb: "Who you are", fields: [
    { name: "full_name", label: "Full name" },
    { name: "account_type", label: "Account type", kind: "select", list: "account_type" },
    { name: "date_of_birth", label: "Date of birth", kind: "date" },
    { name: "gender", label: "Gender", kind: "select", list: "gender", blank: "Prefer not to say" },
    { name: "nationality", label: "Nationality" },
    { name: "id_number", label: "ID or passport number", fixed: "Contact the back office to change this." },
  ] },
  { id: "contact", title: "Contact", blurb: "How we reach you", fields: [
    { name: "email", label: "Email", fixed: "This is your sign-in address." },
    { name: "phone", label: "Mobile number", kind: "tel", hint: "Include the country code, for example +266." },
  ] },
  { id: "address", title: "Address", blurb: "Where you live", fields: [
    { name: "street_address", label: "Street address", wide: true },
    { name: "city", label: "City or town" },
    { name: "state_province", label: "District or province" },
    { name: "postal_code", label: "Postal code" },
    { name: "country", label: "Country" },
  ] },
  { id: "work", title: "Work", blurb: "What you do", fields: [
    { name: "occupation", label: "Occupation" },
    { name: "employer", label: "Employer" },
    { name: "linkedin_profile", label: "LinkedIn", kind: "url", wide: true, hint: "https://…" },
  ] },
  { id: "investor", title: "Investing", blurb: "For share subscriptions", fields: [
    { name: "investor_type", label: "Investor type", kind: "select", list: "investor_type", blank: "Not specified" },
    { name: "source_of_funds", label: "Source of funds" },
    { name: "investment_purpose", label: "Purpose of investing", wide: true },
  ] },
  { id: "business", title: "Business", blurb: "Your company", fields: [
    { name: "business_name", label: "Business name" },
    { name: "company_registration_number", label: "Registration number" },
    { name: "tax_id", label: "Tax ID" },
  ] },
];

export const sectionById = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;

const str = (p: Partial<Record<string, unknown>> | null | undefined, k: string) => (typeof p?.[k] === "string" ? (p[k] as string).trim() : "");

/** The sections worth showing: Investing for investors (or anyone who filled it in), Business for business accounts. */
export function visibleSections(p: Partial<Profile> | null | undefined, roles: readonly string[]): SectionSpec[] {
  const investor = roles.some((r) => r === "investor" || r === "shareholder") || sectionById("investor").fields.some((f) => str(p, f.name));
  return SECTIONS.filter((s) => (s.id === "investor" ? investor : s.id === "business" ? str(p, "account_type") === "business" : true));
}

/** "••••456": enough to recognise, not enough to read out. */
export function maskId(id: string): string {
  const t = id.trim();
  return t.length <= 3 ? "•".repeat(t.length) : `${"•".repeat(Math.min(t.length - 3, 6))}${t.slice(-3)}`;
}

/** What a field shows in the read-only view; null when there is nothing to show. */
export function shown(f: FieldSpec, p: Partial<Profile> | null | undefined, lists: Lists = DEFAULT_LISTS): string | null {
  const v = str(p, f.name);
  if (!v) return null;
  if (f.name === "id_number") return maskId(v);
  if (f.kind === "date") return date(v);
  if (f.kind === "select") return optionsFor(f, lists).find(([val]) => val === v)?.[1] ?? label(v);
  return v;
}

/** The rows of a section that have a value, for the read-only view. */
export const rowsOf = (s: SectionSpec, p: Partial<Profile> | null | undefined, lists: Lists = DEFAULT_LISTS) =>
  s.fields.map((f) => ({ f, value: shown(f, p, lists) })).filter((r): r is { f: FieldSpec; value: string } => r.value !== null);

/** The editable fields of a section (the fixed ones are only ever shown). */
export const editable = (s: SectionSpec) => s.fields.filter((f) => !f.fixed);

/**
 * The update for one section: its editable fields only. Emptied text fields are sent as empty text so a person can remove
 * what they added; an emptied date cannot be cleared (the backend takes a real date or nothing), so it is left out.
 */
export function sectionPayload(s: SectionSpec, v: FormValues, version: number): Record<string, unknown> {
  const out: Record<string, unknown> = { version };
  for (const f of editable(s)) {
    const t = v[f.name as Name]?.trim() ?? "";
    if (t === "" && f.kind === "date") continue;
    out[f.name] = t;
  }
  return out;
}

/** The first one or two letters of a name, for the avatar. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** What would raise the completion percentage: the sections with nothing in them, in order. */
export function missingSections(p: Partial<Profile> | null | undefined, roles: readonly string[]): SectionSpec[] {
  return visibleSections(p, roles).filter((s) => rowsOf(s, p).filter((r) => !r.f.fixed).length === 0);
}
