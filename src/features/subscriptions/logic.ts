import { z } from "zod";

/** One subscription as the screens use it, whichever backend list it came from. */
export type Sub = {
  id: string;
  name: string;
  email: string;
  shares: number;
  shareClass: string | null;
  total: number;
  paid: number;
  method: string;
  status: string;
  paymentStatus: string;
  createdAt: string | null;
  hasProof: boolean;
  /** The numeric id the board routes use; set only for board members' subscriptions. */
  boardId: number | null;
};

type Raw = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v));
const str = (v: unknown, fallback = "") => (v === null || v === undefined ? fallback : String(v));

/** GET /subscriptions/core/subscriptions rows. */
export const fromCore = (r: Raw): Sub => ({
  id: str(r.subscription_id), name: str(r.full_name), email: str(r.email), shares: num(r.num_shares), shareClass: null,
  total: num(r.total_amount), paid: num(r.amount_paid), method: str(r.payment_method), status: str(r.status),
  paymentStatus: str(r.payment_status, str(r.status)), createdAt: (r.created_at as string) ?? null,
  hasProof: !!r.payment_proof_path, boardId: null,
});

/** GET /my-created-subscriptions rows. */
export const fromMine = (r: Raw): Sub => ({ ...fromCore(r), shareClass: (r.share_class as string) ?? null, hasProof: !!r.has_payment_proof });

/** GET /back-office/board/investments/all rows. */
export const fromBoard = (r: Raw): Sub => ({ ...fromCore(r), shareClass: (r.share_class as string) ?? null, boardId: r.id === undefined ? null : Number(r.id) });

export const isFinal = (s: Pick<Sub, "status">) => s.status === "completed" || s.status === "cancelled";
export const outstanding = (s: Pick<Sub, "total" | "paid">) => Math.max(0, s.total - s.paid);
export const awaitingVerification = (s: Sub) => s.hasProof && s.paymentStatus === "proof_submitted" && !isFinal(s);
export const awaitingPayment = (s: Sub) => ["pending", "pending_payment", "rejected"].includes(s.paymentStatus) && !isFinal(s);

export type ActionKey =
  | "verify" | "reject" | "record_payment" | "upload_proof" | "issue_certificate" | "receipt" | "welcome_letter"
  | "transfer_member" | "transfer_class" | "cancel";

/** What a person may do with a subscription, from its status. The backend still has the last word on who may. */
export function allowedActions(s: Sub, opts: { superAdmin?: boolean } = {}): ActionKey[] {
  const out: ActionKey[] = [];
  if (awaitingVerification(s)) out.push("verify", "reject");
  if (!isFinal(s) && outstanding(s) > 0) out.push("record_payment");
  if (!isFinal(s)) out.push("upload_proof");
  if (s.status === "completed") out.push("issue_certificate", "welcome_letter");
  if (s.paid > 0) out.push("receipt");
  if (s.boardId !== null && opts.superAdmin && s.status !== "cancelled") out.push("transfer_member", "transfer_class", "cancel");
  return out;
}

export type Filters = { search: string; status: string; type: "all" | "board" | "mine" };
export const STATUS_FILTERS = ["all", "awaiting_verification", "pending_payment", "partial", "completed", "cancelled"] as const;

export function matchesStatus(s: Sub, status: string): boolean {
  switch (status) {
    case "awaiting_verification": return awaitingVerification(s);
    case "pending_payment": return awaitingPayment(s);
    case "partial": return s.status === "partial" || s.paymentStatus === "partial";
    case "completed": return s.status === "completed";
    case "cancelled": return s.status === "cancelled";
    default: return true;
  }
}

export function filterSubs(rows: readonly Sub[], f: Pick<Filters, "search" | "status">): Sub[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((s) => matchesStatus(s, f.status) && (!q || [s.name, s.email, s.id].some((x) => x.toLowerCase().includes(q))));
}

export function stats(rows: readonly Sub[]) {
  const live = rows.filter((s) => s.status !== "cancelled");
  return {
    count: rows.length,
    awaitingVerification: rows.filter(awaitingVerification).length,
    pendingPayment: rows.filter(awaitingPayment).length,
    completed: rows.filter((s) => s.status === "completed").length,
    total: live.reduce((a, s) => a + s.total, 0),
    paid: live.reduce((a, s) => a + s.paid, 0),
    outstanding: live.reduce((a, s) => a + outstanding(s), 0),
  };
}

export type ShareClass = { name: string; price_per_share: number; min_shares: number; max_shares: number; available_shares: number; currency: string };

export const orderTotal = (shares: number, cls: Pick<ShareClass, "price_per_share"> | undefined) => (cls ? Math.max(0, Math.floor(shares || 0)) * cls.price_per_share : 0);

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "installment", label: "Instalments" },
] as const;

export const newSubscriptionSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the investor's full name"),
  email: z.string().trim().email("Enter a valid email address"),
  id_number: z.string().trim().min(1, "Enter an ID or passport number"),
  phone: z.string().trim().min(5, "Enter a phone number"),
  share_class: z.string().min(1, "Choose a share class"),
  num_shares: z.number({ invalid_type_error: "Enter the number of shares" }).int("Whole shares only").positive("Enter at least 1 share"),
  payment_method: z.enum(["bank_transfer", "crypto", "installment"]),
  admin_notes: z.string().optional(),
});
export type NewSubscription = z.infer<typeof newSubscriptionSchema>;

/** Field messages for the form: the schema's, then the chosen class's limits. Empty object means valid. */
export function validateNew(values: Partial<NewSubscription>, cls: ShareClass | undefined): Record<string, string> {
  const parsed = newSubscriptionSchema.safeParse(values);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
  const n = values.num_shares;
  if (cls && !errors.num_shares && n !== undefined) {
    if (n < cls.min_shares) errors.num_shares = `The minimum for ${cls.name} is ${cls.min_shares}`;
    else if (n > cls.max_shares) errors.num_shares = `The maximum for ${cls.name} is ${cls.max_shares}`;
    else if (n > cls.available_shares) errors.num_shares = `Only ${cls.available_shares} shares are left in ${cls.name}`;
  }
  return errors;
}

export const paymentSchema = z.object({
  amount: z.number({ invalid_type_error: "Enter the amount" }).positive("Enter an amount above zero"),
  payment_reference: z.string().trim().min(1, "Enter the bank reference"),
});

/** Field messages for recording a payment against what is still owed. */
export function validatePayment(v: { amount: number; payment_reference: string }, owed: number): Record<string, string> {
  const parsed = paymentSchema.safeParse(v);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
  if (!errors.amount && v.amount > owed + 0.005) errors.amount = "This is more than the amount still owed";
  return errors;
}
