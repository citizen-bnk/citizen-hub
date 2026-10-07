import { z } from "zod";

export type Cert = {
  id: number;
  number: string;
  holder: string;
  shares: number;
  shareClass: string;
  issued: string | null;
  status: string;
};

type Raw = Record<string, unknown>;
/** A row of GET /certificate-management/certificates (some databases call the holder `shareholder_name`). */
export const fromRow = (r: Raw): Cert => ({
  id: Number(r.id),
  number: String(r.certificate_number ?? ""),
  holder: String(r.full_name ?? r.shareholder_name ?? ""),
  shares: Number(r.shares_count ?? 0),
  shareClass: String(r.share_class ?? ""),
  issued: (r.issue_date as string) ?? null,
  status: String(r.status ?? ""),
});

export type CertAction = "sign" | "download" | "resend" | "regenerate" | "revoke" | "reactivate";

/** What can be done to a certificate, from its status. A revoked one can only be reactivated. */
export function allowedActions(c: Pick<Cert, "status">): CertAction[] {
  if (c.status === "revoked") return ["reactivate"];
  if (c.status === "active") return ["sign", "download", "resend", "regenerate", "revoke"];
  return [];
}

export function filterCerts(rows: readonly Cert[], f: { search: string; status: string; shareClass: string }): Cert[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((c) =>
    (f.status === "all" || c.status === f.status) &&
    (f.shareClass === "all" || c.shareClass === f.shareClass) &&
    (!q || c.holder.toLowerCase().includes(q) || c.number.toLowerCase().includes(q)));
}

export function totals(rows: readonly Cert[]) {
  const active = rows.filter((c) => c.status === "active");
  return { count: rows.length, active: active.length, revoked: rows.filter((c) => c.status === "revoked").length, activeShares: active.reduce((a, c) => a + c.shares, 0) };
}

export const classesOf = (rows: readonly Cert[]) => [...new Set(rows.map((c) => c.shareClass).filter(Boolean))].sort();

export const SIGNER_ROLES = [
  { value: "company_secretary", label: "Company secretary" },
  { value: "chairman", label: "Chairman" },
  { value: "director", label: "Director" },
  { value: "authorized_official", label: "Authorised official" },
] as const;

export const signSchema = z.object({
  signer_name: z.string().trim().min(2, "Enter the signer's name"),
  signer_role: z.enum(["company_secretary", "chairman", "director", "authorized_official"], { errorMap: () => ({ message: "Choose a role" }) }),
  signature_image: z.string().startsWith("data:image/", "Draw a signature first"),
});
export type SignValues = z.infer<typeof signSchema>;

export function validateSign(v: Partial<SignValues>): Record<string, string> {
  const r = signSchema.safeParse(v);
  const errors: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) errors[String(i.path[0])] ??= i.message;
  return errors;
}

/** Revoking needs a reason that the audit log can show. */
export const validateReason = (reason: string): string | undefined => (reason.trim().length < 3 ? "Give a short reason" : undefined);

export const templateSchema = z.object({ template_name: z.string().trim().min(2, "Name the template") });
export function validateTemplate(name: string, file: File | null): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!templateSchema.safeParse({ template_name: name }).success) errors.template_name = "Name the template";
  if (!file) errors.file = "Choose a PDF file";
  else if (!/\.pdf$/i.test(file.name)) errors.file = "The template must be a PDF";
  return errors;
}
