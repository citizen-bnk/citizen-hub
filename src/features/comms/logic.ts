/** Pure rules for the Communications screens: draft status, selection, validation. No React, no API. */

export type DraftStatus = "draft" | "approved" | "sent" | "cancelled";

type HasStatus = { id: number; status: string };

/** Only a fresh draft can be approved. */
export const canApprove = (status: string) => status === "draft";
/** Only an approved draft can be sent. */
export const canSend = (status: string) => status === "approved";
/** A draft or approved draft can still be cancelled; sent and cancelled ones are final. */
export const canCancel = (status: string) => status === "draft" || status === "approved";

/** The ids among the selected rows that an action applies to (the backend ignores the rest, but the button should not lie). */
export function idsFor(action: "approve" | "send" | "cancel", rows: readonly HasStatus[], selected: ReadonlySet<number>): number[] {
  const ok = action === "approve" ? canApprove : action === "send" ? canSend : canCancel;
  return rows.filter((r) => selected.has(r.id) && ok(r.status)).map((r) => r.id);
}

export function countByStatus(rows: readonly { status: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}

/** A failed email can be retried; anything else cannot. */
export const canRetry = (status: string) => status === "failed";

/** Failed emails among the queue counts (`failed` may be missing or null). */
export const failedCount = (stats: { failed?: number | null } | null | undefined) => stats?.failed ?? 0;

// ---- forms ---------------------------------------------------------------------------------------------------------

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select" | "url";
  options?: readonly string[];
  required?: boolean;
  max?: number;
  hint?: string;
};
export type Values = Record<string, string>;

/** Field name -> message, for the fields that are missing, too long or not a valid value. Empty when the form is fine. */
export function validate(fields: readonly FieldDef[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.name] ?? "").trim();
    if (f.required && !v) errors[f.name] = `${f.label} is required`;
    else if (v && f.max && v.length > f.max) errors[f.name] = `${f.label} must be at most ${f.max} characters`;
    else if (v && f.type === "number" && !Number.isInteger(Number(v))) errors[f.name] = `${f.label} must be a whole number`;
    else if (v && f.type === "date" && Number.isNaN(Date.parse(v))) errors[f.name] = `${f.label} must be a date`;
    else if (v && f.type === "url" && !/^(https?:\/\/|\/)\S+$/.test(v)) errors[f.name] = `${f.label} must be a web address`;
    else if (v && f.type === "select" && f.options && !f.options.includes(v)) errors[f.name] = `Choose a ${f.label.toLowerCase()}`;
  }
  return errors;
}

/** Text boxes give strings; the backend wants numbers and nulls. Empty optional text becomes null. */
export function toBody(fields: readonly FieldDef[], values: Values): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const f of fields) {
    const v = (values[f.name] ?? "").trim();
    out[f.name] = f.type === "number" ? (v === "" ? 0 : Number(v)) : v === "" && !f.required ? null : v;
  }
  return out;
}

/** "2026-03-04T10:00:00Z" or a Date value -> "2026-03-04" for a date input. */
export const dateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");

/** Starting values for a form: the item's fields as text, or empty strings. */
export function initialValues(fields: readonly FieldDef[], item?: Record<string, unknown> | null): Values {
  const out: Values = {};
  for (const f of fields) {
    const raw = item?.[f.name];
    out[f.name] = raw === null || raw === undefined ? (f.options?.[0] && !item ? f.options[0] : "") : f.type === "date" ? dateInput(String(raw)) : String(raw);
  }
  return out;
}
