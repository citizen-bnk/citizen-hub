import { z } from "zod";
import { label } from "@/platform/format";
import { policy } from "@/platform/policy/current";

/** Pure rules for the profile form, notification settings and the to-do list. */

/* ---------- profile ---------- */

export const FIELDS = [
  "full_name", "phone", "account_type", "gender", "date_of_birth", "nationality",
  "street_address", "city", "state_province", "postal_code", "country",
  "occupation", "employer", "linkedin_profile",
  "source_of_funds", "investor_type", "investment_purpose",
  "business_name", "company_registration_number", "tax_id",
] as const;
export type Field = (typeof FIELDS)[number];
/** Every field of the form as the text the person typed. */
export type FormValues = Record<Field, string> & { email: string; id_number: string };

/** A blank form; the country (and nationality) start as the policy's default country. */
export const emptyForm = (country: string = policy("app.default_country")): FormValues => ({ ...(Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<Field, string>), account_type: "personal", country, nationality: country, email: "", id_number: "" });

/** The form as filled from the stored profile (nulls become empty text). */
export function fromProfile(p: Partial<Record<string, unknown>> | null | undefined, email = ""): FormValues {
  const base = emptyForm();
  if (!p) return { ...base, email };
  for (const f of [...FIELDS, "email", "id_number"] as const) if (typeof p[f] === "string") base[f] = p[f] as string;
  return { ...base, email: base.email || email };
}

const text = (max = 120) => z.string().trim().max(max, "That is too long.");
const base = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number, for example +266 5800 1234."),
  account_type: z.string().trim().min(1, "Choose an account type."),
  gender: text(), nationality: text(),
  date_of_birth: z.string().refine((v) => v === "" || (!Number.isNaN(Date.parse(v)) && new Date(v) < new Date()), "Enter a date of birth in the past."),
  street_address: text(200), city: text(), state_province: text(), postal_code: text(20), country: text(),
  occupation: text(), employer: text(),
  linkedin_profile: z.string().trim().refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Enter a full link starting with https://"),
  source_of_funds: text(), investor_type: text(), investment_purpose: text(),
  business_name: text(), company_registration_number: text(), tax_id: text(),
  email: z.string().trim(), id_number: z.string().trim(),
});

/** What must be filled in: the short setup form asks for the address and date of birth too; registering needs email and ID. */
export function validateProfile(v: FormValues, opts: { register?: boolean; requireAddress?: boolean } = {}): Record<string, string> {
  const errors: Record<string, string> = {};
  const parsed = base.safeParse(v);
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
  const need = (k: keyof FormValues, msg: string) => { if (!v[k].trim()) errors[k] ??= msg; };
  if (opts.register) {
    if (!/^\S+@\S+\.\S+$/.test(v.email)) errors.email ??= "Enter a valid email address.";
    if (v.id_number.trim().length < 5) errors.id_number ??= "Enter your ID or passport number.";
  }
  if (opts.requireAddress) {
    need("date_of_birth", "Enter your date of birth.");
    need("street_address", "Enter your street address.");
    need("city", "Enter your city or town.");
    need("country", "Enter your country.");
  }
  if (v.account_type === "business") {
    need("business_name", "Enter the business name.");
    need("company_registration_number", "Enter the registration number.");
  }
  return errors;
}

/** The body the backend takes: empty answers are left out (it only changes what it is sent). */
export function toPayload(v: FormValues, extra: { version?: number; register?: boolean } = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (v.account_type !== "business" && ["business_name", "company_registration_number", "tax_id"].includes(f)) continue;
    const t = v[f].trim();
    if (t) out[f] = t;
  }
  if (extra.register) Object.assign(out, { email: v.email.trim(), id_number: v.id_number.trim() });
  else if (extra.version !== undefined) out.version = extra.version;
  return out;
}

/** Whether the first-time setup still needs doing. */
export const needsSetup = (p: Partial<Record<string, unknown>> | null | undefined) =>
  !p || !["full_name", "phone", "date_of_birth", "street_address", "city", "country"].every((k) => !!p[k]);
