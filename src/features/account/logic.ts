import { z } from "zod";
import { label } from "@/platform/format";

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

export const emptyForm = (): FormValues => ({ ...(Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<Field, string>), account_type: "personal", country: "Lesotho", nationality: "Lesotho", email: "", id_number: "" });

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
  account_type: z.enum(["personal", "business"]),
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

/* ---------- notification settings ---------- */

export type Prefs = { channel_email: boolean; channel_sms: boolean; channel_push: boolean; quiet_hours_start: string | null; quiet_hours_end: string | null; timezone: string };
export type PrefsForm = { channel_email: boolean; channel_sms: boolean; channel_push: boolean; dnd: boolean; start: string; end: string; timezone: string };

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");
export const prefsToForm = (p: Prefs): PrefsForm => ({
  channel_email: p.channel_email, channel_sms: p.channel_sms, channel_push: p.channel_push,
  dnd: !!(p.quiet_hours_start && p.quiet_hours_end), start: hhmm(p.quiet_hours_start) || "22:00", end: hhmm(p.quiet_hours_end) || "07:00", timezone: p.timezone,
});

/** A message when the do-not-disturb hours cannot be saved. */
export function checkQuietHours(f: PrefsForm): string | null {
  if (!f.dnd) return null;
  if (!/^\d{2}:\d{2}$/.test(f.start) || !/^\d{2}:\d{2}$/.test(f.end)) return "Choose both a start and an end time.";
  if (f.start === f.end) return "The start and end times must be different.";
  return null;
}
export const prefsPayload = (f: PrefsForm) => ({
  channel_email: f.channel_email, channel_sms: f.channel_sms, channel_push: f.channel_push, timezone: f.timezone,
  quiet_hours_start: f.dnd ? `${f.start}:00` : null, quiet_hours_end: f.dnd ? `${f.end}:00` : null,
});

/* ---------- to do ---------- */

export type TodoItem = { id: string; title: string; body?: string; href?: string; notificationId?: number };
export type TodoFeed = {
  profileMissing: boolean;
  notifications: { id: number; email_subject: string; email_content: string; email_type: string; read_status: boolean; metadata: { url?: string } | null }[];
  invitations: { token: string; role: string; invited_by_name: string | null }[];
};

/** Old website addresses the backend still puts in notifications, mapped to where the Hub now handles them. */
const MOVED: Record<string, string> = {
  "/complete-profile": "/account/setup", "/board-onboarding": "/account/setup", "/profile": "/account",
  "/my-subscriptions": "/portfolio", "/invest": "/portfolio", "/board-documents": "/compliance",
  "/board-portal-invitations": "/invitations",
};
const BY_TYPE: Record<string, string> = { profile_completion: "/account/setup" };

export function linkFor(n: { email_type: string; metadata: { url?: string } | null }): string | undefined {
  const url = n.metadata?.url;
  if (typeof url === "string" && url.startsWith("/")) return MOVED[url.split("?")[0].replace(/\/$/, "").toLowerCase()] ?? url;
  return BY_TYPE[n.email_type];
}

/** Notification bodies are email text, sometimes HTML: plain and short for a list. */
export const plain = (s: string, max = 110) => {
  const t = s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

/** One list from one feed: profile first, then invitations, then unread notifications. */
export function buildTodo(feed: TodoFeed): TodoItem[] {
  const items: TodoItem[] = [];
  if (feed.profileMissing) items.push({ id: "profile", title: "Complete your profile", body: "Tell us who you are to use the Hub.", href: "/account/setup" });
  for (const i of feed.invitations) items.push({ id: `inv-${i.token}`, title: `Accept your invitation as ${label(i.role).toLowerCase()}`, body: i.invited_by_name ? `Invited by ${i.invited_by_name}` : undefined, href: "/invitations" });
  for (const n of feed.notifications.filter((x) => !x.read_status)) {
    // The old "complete your profile" notification is the same job as the item above.
    if (feed.profileMissing && n.email_type === "profile_completion") continue;
    items.push({ id: `n-${n.id}`, title: n.email_subject, body: plain(n.email_content), href: linkFor(n), notificationId: n.id });
  }
  return items;
}
