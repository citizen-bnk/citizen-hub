import { z } from "zod";
import { DEFAULT_POLICY, type ListItem, type PolicyKey, type PolicyPlan, type PolicyValues, type Snapshot } from "./defaults";

/** Pure rules for reading the policy response. Nothing here throws: a bad key or item falls back to its default. */

const text = z.string().trim().min(1);
const days = z.number().int().min(0).max(3650);

/** One schema per typed key. A value that does not fit is ignored and the default stays. */
const KEY_SCHEMAS = {
  "legal.company_name": text,
  "legal.registration_number": text,
  "legal.licence_status": text,
  "legal.footer": text,
  "brand.name": text,
  "app.base_currency": z.string().trim().length(3).transform((s) => s.toUpperCase()),
  "app.default_country": text,
  "payments.deadline_days": days.nullable(),
  "payments.reminder_days": z.array(days),
  "invitations.expiry_days": z.object({ board: days, investor: days, subscription: days }),
  "careers.apply_email": z.string().trim().email().nullable(),
  "careers.apply_instructions": z.string().trim().min(1).nullable(),
} satisfies Record<PolicyKey, z.ZodTypeAny>;

const planSchema = z.object({
  code: text, label: text, months: z.number().int().min(1).max(120),
  audience: z.string().optional().nullable().transform((a) => a ?? undefined), display_order: z.number().optional().default(0),
});
const itemSchema = z.object({ code: z.string(), label: text, display_order: z.number().optional().default(0), meta: z.record(z.unknown()).nullish() });

const byOrder = <T extends { display_order: number }>(rows: T[]) => [...rows].sort((a, b) => a.display_order - b.display_order);
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Keep the items that are valid, in display order. */
function validItems<T>(raw: unknown, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T[] {
  return Array.isArray(raw) ? raw.flatMap((r) => { const p = schema.safeParse(r); return p.success ? [p.data] : []; }) : [];
}

/**
 * Merge a /policy response over `base` (the defaults). Per key: a valid value replaces the default, anything else keeps it.
 * Plans replace the default list only when at least one valid plan arrives; each list is replaced only when it has valid items.
 */
export function resolvePolicy(raw: unknown, base: Snapshot = DEFAULT_POLICY): Snapshot {
  const r = rec(raw);
  const incoming = rec(r.policies);
  const policies: Record<string, unknown> = { ...base.policies };
  for (const key of Object.keys(KEY_SCHEMAS) as PolicyKey[]) {
    const schema: z.ZodTypeAny = KEY_SCHEMAS[key];
    if (!(key in incoming)) continue;
    const parsed = schema.safeParse(incoming[key]);
    if (parsed.success) policies[key] = parsed.data;
  }
  const plans = byOrder(validItems(r.plans, planSchema) as PolicyPlan[]);
  const lists: Record<string, ListItem[]> = { ...base.lists };
  for (const [name, rows] of Object.entries(rec(r.lists))) {
    const items = byOrder(validItems(rows, itemSchema) as ListItem[]);
    if (items.length) lists[name] = items;
  }
  return {
    version: typeof r.version === "number" ? r.version : base.version,
    policies: policies as PolicyValues,
    plans: plans.length ? plans : base.plans,
    lists,
  };
}

/** The options of a list as [code, label] pairs; an unknown list is empty. */
export const listOptions = (s: Snapshot, name: string): [string, string][] => (s.lists[name] ?? []).map((i) => [i.code, i.label]);

/** What a stored code is called, falling back to the code itself. */
export const listLabel = (s: Snapshot, name: string, code: string): string => s.lists[name]?.find((i) => i.code === code)?.label ?? code;
