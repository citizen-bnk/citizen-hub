import { z } from "zod";

/** ---- Invitations ---- */

/** The roles the backend accepts on POST /back-office/invitations/create. */
export const INVITABLE_ROLES = ["board_member", "investor"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];
export const POSITIONS = ["chairman", "vice_chairman", "director", "secretary", "treasurer", "member"] as const;

/** Keep only the roles the permission check said yes to. */
export function permittedRoles(checks: Record<string, boolean | undefined>): InvitableRole[] {
  return INVITABLE_ROLES.filter((r) => checks[r] === true);
}

export const inviteSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter their full name"),
    email: z.string().trim().email("Enter a valid email address"),
    role: z.enum(INVITABLE_ROLES, { errorMap: () => ({ message: "Choose a role" }) }),
    position: z.string().optional(),
    message: z.string().optional(),
    expires_at: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role === "board_member" && !v.position) ctx.addIssue({ code: "custom", path: ["position"], message: "Choose a position" });
  });
export type InviteInput = z.infer<typeof inviteSchema>;

/** Body for the create call: drops empty optional fields and a position that does not apply. */
export function inviteBody(v: InviteInput) {
  return {
    full_name: v.full_name.trim(),
    email: v.email.trim(),
    role: v.role,
    position: v.role === "board_member" ? v.position : undefined,
    message: v.message?.trim() || undefined,
    expires_at: v.expires_at || undefined,
  };
}

type InvitationLike = { status: string; expires_at?: string | null };

/** The status to show: a pending invitation whose date has passed is expired. */
export function effectiveStatus(inv: InvitationLike, now: Date = new Date()): string {
  const s = inv.status;
  if (s === "pending" && inv.expires_at && new Date(inv.expires_at).getTime() < now.getTime()) return "expired";
  return s;
}

/** Only a waiting invitation (pending, or an investor one that is "sent") can be resent. */
export const canResend = (status: string) => status === "pending" || status === "sent";
/** The backend lets only a super admin cancel, and only a pending invitation. */
export const canCancel = (status: string, isSuperAdmin: boolean) => isSuperAdmin && status === "pending";

export const INVITATION_TABS = ["all", "pending", "accepted", "expired"] as const;
export type InvitationTab = (typeof INVITATION_TABS)[number];

export function inTab(status: string, tab: InvitationTab): boolean {
  if (tab === "all") return true;
  if (tab === "pending") return status === "pending" || status === "sent";
  if (tab === "expired") return status === "expired" || status === "cancelled";
  return status === tab;
}

/** ---- Leads ---- */

export const LEAD_STATUSES = ["new", "contacted", "interested", "invited", "converted", "declined"] as const;
export const LEAD_SOURCES = ["website", "referral", "event", "social_media", "direct"] as const;
export const SHARE_CLASSES = ["Class A - Ordinary Shares", "Class B - Preference Shares"] as const;

export const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Enter their full name"),
  email: z.string().trim().email("Enter a valid email address"),
  country: z.string().trim().min(2, "Enter a country"),
  phone: z.string().optional(),
  company: z.string().optional(),
  lead_source: z.string().default("direct"),
  notes: z.string().optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const inviteLeadSchema = z.object({
  share_class: z.string().min(1, "Choose a share class"),
  minimum_investment: z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Enter an amount above zero"),
  special_terms: z.string().optional(),
});

/** A lead already converted cannot be invited (the backend refuses it). */
export const canInviteLead = (status: string) => status !== "converted";

/** Conversion funnel for the stat tiles, from the analytics response. */
export function pipeline(a: { total_leads: number; leads_by_status: Record<string, number>; conversion_rate: number; total_invited: number; invitation_response_rate: number }) {
  const n = (s: string) => a.leads_by_status[s] ?? 0;
  return {
    total: a.total_leads,
    open: n("new") + n("contacted") + n("interested"),
    invited: a.total_invited,
    converted: n("converted"),
    conversionRate: a.conversion_rate,
    responseRate: a.invitation_response_rate,
  };
}

/** ---- CSV import (columns the backend's bulk-import reads) ---- */

export const CSV_COLUMNS = ["full_name", "email", "phone", "company", "country", "lead_source", "investment_interest_amount", "preferred_share_class", "notes"] as const;
const REQUIRED = ["full_name", "email", "country"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RFC-4180-ish parser: quoted fields, doubled quotes, commas and line breaks inside quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

export type CsvLead = Record<(typeof CSV_COLUMNS)[number], string>;
export type CsvResult = { valid: CsvLead[]; errors: { row: number; message: string }[]; missingColumns: string[] };

const norm = (h: string) => h.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** Reads a CSV into leads. Row numbers match the spreadsheet (header is row 1). Flags missing fields, bad emails and repeats. */
export function validateLeadCsv(text: string): CsvResult {
  const [head, ...body] = parseCsv(text);
  const header = (head ?? []).map(norm);
  const missingColumns = REQUIRED.filter((c) => !header.includes(c));
  if (missingColumns.length) return { valid: [], errors: [], missingColumns };
  const valid: CsvLead[] = [];
  const errors: CsvResult["errors"] = [];
  const seen = new Set<string>();
  body.forEach((cells, i) => {
    const row = i + 2;
    const lead = Object.fromEntries(CSV_COLUMNS.map((c) => [c, (cells[header.indexOf(c)] ?? "").trim()])) as CsvLead;
    const missing = REQUIRED.filter((c) => !lead[c]);
    if (missing.length) return errors.push({ row, message: `Missing ${missing.join(", ")}` });
    if (!EMAIL.test(lead.email)) return errors.push({ row, message: `${lead.email} is not a valid email` });
    const key = lead.email.toLowerCase();
    if (seen.has(key)) return errors.push({ row, message: `${lead.email} appears twice in the file` });
    if (lead.investment_interest_amount && Number.isNaN(Number(lead.investment_interest_amount))) {
      return errors.push({ row, message: "Interest amount is not a number" });
    }
    seen.add(key);
    valid.push(lead);
  });
  return { valid, errors, missingColumns: [] };
}

const quote = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
/** The clean rows as CSV text, for the backend's upload. */
export function toCsv(rows: CsvLead[]): string {
  return [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => quote(r[c])).join(","))].join("\n");
}

/** ---- Users ---- */

export const canSuspend = (status: string) => status !== "suspended";
export const canReactivate = (status: string) => status === "suspended";
/** Roles a person does not hold yet, to offer for granting. */
export const grantable = (all: string[], held: string[]) => all.filter((r) => !held.includes(r));
/** Roles filter on top of the backend's search/status (the backend has no role filter). */
export const withRole = <T extends { roles: string[] }>(users: T[], role: string) => (role === "all" ? users : users.filter((u) => u.roles.includes(role)));
export const initials = (name: string | null | undefined) => (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
