import { z } from "zod";

/** Pure rules for subscriptions, amounts and the buy flow. Amounts arrive as numbers or numeric strings. */
const n = (v: number | string | null | undefined) => Number(v) || 0;

export type SubLike = {
  status: string;
  total_amount: number | string;
  amount_paid: number | string;
  num_shares: number;
  certificate_number?: string | null;
};

export const remaining = (s: Pick<SubLike, "total_amount" | "amount_paid">) => Math.max(0, n(s.total_amount) - n(s.amount_paid));
export const isCancelled = (s: Pick<SubLike, "status">) => s.status === "cancelled";
/** Something is still owed. */
export const isOutstanding = (s: SubLike) => !isCancelled(s) && remaining(s) > 0;
export const isFullyPaid = (s: SubLike) => !isCancelled(s) && n(s.total_amount) > 0 && remaining(s) === 0;
/** 0..100 */
export const paidPercent = (s: SubLike) => (n(s.total_amount) > 0 ? Math.min(100, Math.round((n(s.amount_paid) / n(s.total_amount)) * 100)) : 0);

/**
 * Totals for the summary. Worked out here, not taken from the backend summary, which ignores subscriptions
 * that were just created (status "active").
 */
export function summarise(subs: readonly SubLike[]) {
  const live = subs.filter((s) => !isCancelled(s));
  return {
    count: live.length,
    shares: live.reduce((t, s) => t + s.num_shares, 0),
    invested: live.reduce((t, s) => t + n(s.total_amount), 0),
    paid: live.reduce((t, s) => t + n(s.amount_paid), 0),
    owed: live.reduce((t, s) => t + remaining(s), 0),
    pending: live.filter(isOutstanding).length,
    certificates: live.filter((s) => !!s.certificate_number).length,
  };
}

/** Whole days until the deadline (negative once passed); null when there is none. */
export function daysLeft(deadline: string | null | undefined, now = new Date()): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

export type PaymentLike = { status: string };
/** Documents the person can fetch, by the backend's own rules. */
export function documentsFor(sub: SubLike, payments: readonly PaymentLike[]) {
  return {
    certificate: !!sub.certificate_number,
    receipt: payments.some((p) => p.status === "verified"),
    welcome: sub.status === "completed",
  };
}

/** A certificate can be asked for once fully paid, when none exists and no request is open. */
export const canRequestCertificate = (sub: SubLike, openRequests: number) => isFullyPaid(sub) && !sub.certificate_number && openRequests === 0;

/* ---------- buying ---------- */

export type ShareClass = { name: string; description: string; min_shares: number; max_shares: number; price_per_share: number; restricted: boolean; benefits?: string[] };

export type Offer = { classes: ShareClass[]; available?: number };
type Availability = { remaining: number; price_per_share: number | string; min_subscription: number; max_subscription: number };

/** Investors buy one standard class from the public offering. */
export const investorOffer = (a: Availability): Offer => ({
  available: a.remaining,
  classes: [{ name: "Class B", description: "Ordinary shares: voting rights and dividend eligibility.", min_shares: a.min_subscription, max_shares: Math.min(a.max_subscription, a.remaining), price_per_share: Number(a.price_per_share), restricted: false }],
});

/** Class C (restricted) is offered only to board members. */
export const offeredClasses = (classes: readonly ShareClass[], isBoard: boolean) => classes.filter((c) => !c.restricted || isBoard);

export const orderTotal = (shares: number, price: number) => (Number.isFinite(shares) ? Math.max(0, Math.floor(shares)) * price : 0);

/** A message when the quantity is not allowed, otherwise null. `available` is how many shares are left to buy. */
export function checkQuantity(shares: number, limits: { min: number; max: number; available?: number }): string | null {
  if (!Number.isInteger(shares) || shares <= 0) return "Enter a whole number of shares.";
  if (shares < limits.min) return `The minimum is ${limits.min.toLocaleString("en-ZA")} shares.`;
  if (shares > limits.max) return `The maximum is ${limits.max.toLocaleString("en-ZA")} shares.`;
  if (limits.available !== undefined && shares > limits.available) return `Only ${limits.available.toLocaleString("en-ZA")} shares are left.`;
  return null;
}

export const PLANS = [
  { value: "one-time", label: "Pay in full", months: 1 },
  { value: "3-months", label: "3 monthly instalments", months: 3 },
  { value: "6-months", label: "6 monthly instalments", months: 6 },
  { value: "12-months", label: "12 monthly instalments", months: 12 },
] as const;
export type Plan = (typeof PLANS)[number]["value"];

export const monthlyAmount = (total: number, plan: Plan) => total / (PLANS.find((p) => p.value === plan)?.months ?? 1);
/** The board endpoint speaks "one_time" and a number of months. */
export const boardPlan = (plan: Plan) => (plan === "one-time" ? { payment_method: "one_time" } : { payment_method: "installment", installment_months: PLANS.find((p) => p.value === plan)!.months });

/** The details the subscribe endpoint needs. */
export const detailsSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  id_number: z.string().trim().min(5, "Enter your ID or passport number."),
});
export type Details = z.infer<typeof detailsSchema>;

/** Field messages from the schema, keyed by field name. */
export function fieldErrors(schema: z.ZodTypeAny, value: unknown): Record<string, string> {
  const r = schema.safeParse(value);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
}
