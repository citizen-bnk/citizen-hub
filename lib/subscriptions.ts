import { z } from "zod";

/**
 * Subscription rules. Hub records and reviews subscription requests; it never moves money. Settlement is
 * confirmed by a person who has seen the evidence, and the price always comes from the opportunity record.
 */
export const subscriptionStatuses = [
  "submitted", "under_review", "awaiting_agreement", "awaiting_payment", "received", "pending_conversion", "declined", "withdrawn",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const statusLabels: Record<SubscriptionStatus, string> = {
  submitted: "Request received",
  under_review: "Under review",
  awaiting_agreement: "Agreement pending",
  awaiting_payment: "Payment outstanding",
  received: "Payment confirmed",
  pending_conversion: "Awaiting conversion",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

/** What a reviewer may move a request to. Closed requests stay closed; confirmed receipt is never reversed here. */
export const reviewTransitions: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  submitted: ["under_review", "awaiting_agreement", "awaiting_payment", "received", "declined"],
  under_review: ["under_review", "awaiting_agreement", "awaiting_payment", "received", "declined"],
  awaiting_agreement: ["under_review", "awaiting_agreement", "awaiting_payment", "received", "declined"],
  awaiting_payment: ["under_review", "awaiting_agreement", "awaiting_payment", "received", "declined"],
  received: ["received", "pending_conversion"],
  pending_conversion: ["pending_conversion"],
  declined: [],
  withdrawn: [],
};

export const isPaid = (status: string) => status === "received" || status === "pending_conversion";
export const isOpen = (status: string) => ["submitted", "under_review", "awaiting_agreement", "awaiting_payment"].includes(status);

/** An investor may withdraw only before any agreement or payment evidence is attached. */
export function withdrawalAllowed(record: { status: string; agreement_link: string | null; payment_link: string | null }) {
  return isOpen(record.status) && !record.agreement_link && !record.payment_link;
}

export function nextStep(record: { status: string; agreement_link: string | null; payment_link: string | null }): string {
  switch (record.status) {
    case "withdrawn": return "This request was withdrawn. Start a new subscription if you still wish to invest.";
    case "declined": return "Read the reviewer’s note below. Contact investor support if you need clarification.";
    case "received": case "pending_conversion": return "Payment is confirmed. This status does not by itself issue shares; follow your agreement for conversion.";
    case "awaiting_agreement": return "Your reviewer is arranging the supporting agreement. You will be notified when it is ready.";
    case "awaiting_payment": return "Payment is outstanding. Follow the instructions you were given; a reviewer confirms settlement.";
    default: return "A reviewer will assess your request. You can withdraw it until an agreement or payment record is attached.";
  }
}

/** Server-side amount. Integers only (minor units) so there is no floating-point drift. */
export function subscriptionAmount(units: number, unitPrice: string | number): string {
  const cents = Math.round(Number(unitPrice) * 100);
  if (!Number.isInteger(units) || units <= 0 || !Number.isFinite(cents) || cents <= 0) throw new RangeError("Invalid quantity or price.");
  const total = BigInt(units) * BigInt(cents);
  const text = total.toString().padStart(3, "0");
  return `${text.slice(0, -2)}.${text.slice(-2)}`;
}

export function checkUnits(units: number, min: number, max: number | null): string | null {
  if (!Number.isInteger(units) || units <= 0) return "Enter a whole number of units.";
  if (units < min) return `The minimum for this opportunity is ${min.toLocaleString()} units.`;
  if (max !== null && units > max) return `The maximum for this opportunity is ${max.toLocaleString()} units.`;
  return null;
}

export const subscribeInput = z.object({
  action: z.literal("subscribe"),
  request_key: z.string().uuid(),
  opportunity_id: z.string().uuid(),
  version: z.number().int().positive(),
  units: z.number().int().positive().max(2147483647),
  source_of_funds: z.string().trim().min(3).max(2000),
  purpose: z.string().trim().min(3).max(2000),
  consent: z.literal(true),
}).strict();

export const withdrawInput = z.object({ action: z.literal("withdraw"), id: z.string().uuid(), version: z.number().int().positive() }).strict();

/** Evidence must be a Google Drive file or document, matching the database constraint. */
const evidenceLink = z.string().trim().max(1000).refine((value) => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    return (url.hostname === "drive.google.com" && /^\/file\/d\/[\w-]{10,200}(\/|$)/.test(url.pathname))
      || (url.hostname === "docs.google.com" && /^\/document\/d\/[\w-]{10,200}(\/|$)/.test(url.pathname));
  } catch { return false; }
}, "Use a Google Drive file or Google Docs link.");

export const reviewInput = z.object({
  action: z.literal("review"),
  id: z.string().uuid(),
  version: z.number().int().positive(),
  status: z.enum(subscriptionStatuses),
  note: z.string().trim().max(2000).default(""),
  agreement_link: evidenceLink.optional().or(z.literal("").transform(() => undefined)),
  payment_link: evidenceLink.optional().or(z.literal("").transform(() => undefined)),
}).strict();
export type ReviewInput = z.infer<typeof reviewInput>;

/** Returns why a review cannot be applied, or null when it can. Pure so it is tested without a database. */
export function reviewProblem(
  current: { status: string; agreement_link: string | null; payment_link: string | null; person_id: string },
  input: { status: SubscriptionStatus; note: string; agreement_link?: string; payment_link?: string },
  reviewerId: string,
): string | null {
  if (current.person_id === reviewerId) return "You cannot review your own subscription.";
  const allowed = reviewTransitions[current.status as SubscriptionStatus];
  if (!allowed || !allowed.includes(input.status)) return "This request cannot move to that status.";
  if (input.status === "declined" && input.note.length < 8) return "Explain the decision to the investor in at least a short sentence.";
  if (isPaid(input.status)) {
    if (!(input.agreement_link ?? current.agreement_link)) return "Link the signed agreement before confirming payment.";
    if (!(input.payment_link ?? current.payment_link)) return "Link the payment evidence before confirming payment.";
    if (input.status === "received" && current.status !== "received" && input.note.length < 8) return "Record how settlement was reconciled before confirming payment.";
  }
  return null;
}
