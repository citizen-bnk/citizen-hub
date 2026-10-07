import { z } from "zod";
import type { ShareClass, ShareClassChanges } from "./api";

/** First message per field of a zod failure, or {} when valid. */
export function fieldErrors(result: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const i of result.error.issues) out[String(i.path[0] ?? "_")] ??= i.message;
  return out;
}

// --- share classes

export type ShareClassForm = { price_per_share: string; min_shares: string; max_shares: string; shares_on_offer: string; description: string };

export const toForm = (c: ShareClass): ShareClassForm => ({
  price_per_share: String(c.price_per_share), min_shares: String(c.min_shares), max_shares: String(c.max_shares),
  shares_on_offer: String(c.shares_on_offer), description: c.description ?? "",
});

const whole = (v: string) => /^\d+$/.test(v.trim());

/** Problems with a share class edit, keyed by field. `issued` is how many shares are already sold. */
export function shareClassErrors(f: ShareClassForm, issued: number): Record<string, string> {
  const e: Record<string, string> = {};
  const price = Number(f.price_per_share);
  if (f.price_per_share.trim() === "" || !Number.isFinite(price) || price <= 0) e.price_per_share = "Enter a price above zero";
  else if (!/^\d+(\.\d{1,2})?$/.test(f.price_per_share.trim())) e.price_per_share = "Use at most two decimals";
  if (!whole(f.min_shares) || Number(f.min_shares) < 1) e.min_shares = "At least 1 share";
  if (!whole(f.max_shares)) e.max_shares = "Enter a whole number";
  else if (!e.min_shares && Number(f.max_shares) < Number(f.min_shares)) e.max_shares = "Must not be below the minimum";
  if (!whole(f.shares_on_offer)) e.shares_on_offer = "Enter a whole number, 0 or more";
  else if (Number(f.shares_on_offer) < issued) e.shares_on_offer = `Cannot be below the ${issued.toLocaleString("en-ZA")} shares already issued`;
  return e;
}

/** Only the fields that differ from what is saved, as the backend expects them. */
export function shareClassChanges(current: ShareClass, f: ShareClassForm): ShareClassChanges {
  const out: ShareClassChanges = {};
  if (Number(f.price_per_share) !== current.price_per_share) out.price_per_share = Number(f.price_per_share);
  if (Number(f.min_shares) !== current.min_shares) out.min_shares = Number(f.min_shares);
  if (Number(f.max_shares) !== current.max_shares) out.max_shares = Number(f.max_shares);
  if (Number(f.shares_on_offer) !== current.shares_on_offer) out.shares_on_offer = Number(f.shares_on_offer);
  if (f.description.trim() !== (current.description ?? "")) out.description = f.description.trim();
  return out;
}

/** Share of the offer already issued, 0 to 100. */
export const soldPercent = (c: Pick<ShareClass, "shares_on_offer" | "shares_issued">) =>
  c.shares_on_offer > 0 ? Math.min(100, Math.round((c.shares_issued / c.shares_on_offer) * 100)) : 0;

// --- bank accounts

export const bankSchema = z.object({
  account_name: z.string().trim().min(2, "Enter the account name"),
  bank_name: z.string().trim().min(2, "Enter the bank name"),
  account_number: z.string().trim().regex(/^[0-9A-Za-z\- ]{4,34}$/, "Enter the account number (4 to 34 letters or digits)"),
  branch_code: z.string().trim().min(1, "Enter the branch code"),
  branch_name: z.string().trim(),
  swift_code: z.string().trim().refine((v) => v === "" || /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/.test(v), "A SWIFT code has 8 or 11 characters"),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code, e.g. LSL"),
  description: z.string().trim(),
});
export type BankForm = z.infer<typeof bankSchema>;
export const emptyBank: BankForm = { account_name: "", bank_name: "", account_number: "", branch_code: "", branch_name: "", swift_code: "", currency: "LSL", description: "" };

// --- crypto wallets

export const CRYPTO_TYPES = ["BTC", "ETH", "USDT"] as const;
export type CryptoType = (typeof CRYPTO_TYPES)[number];

const PATTERNS: Record<CryptoType, { re: RegExp; hint: string }> = {
  BTC: { re: /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/, hint: "A Bitcoin address starts with bc1, 1 or 3" },
  ETH: { re: /^0x[0-9a-fA-F]{40}$/, hint: "An Ethereum address is 0x followed by 40 hex characters" },
  USDT: { re: /^(0x[0-9a-fA-F]{40}|T[1-9A-HJ-NP-Za-km-z]{33})$/, hint: "A USDT address is 0x… (Ethereum network) or T… (Tron network)" },
};

/** A message when the address cannot be a valid address for the coin, otherwise undefined. */
export function walletAddressError(type: string, address: string): string | undefined {
  const p = PATTERNS[type as CryptoType];
  if (!p) return "Choose BTC, ETH or USDT";
  const a = address.trim();
  if (!a) return "Enter the wallet address";
  return p.re.test(a) ? undefined : p.hint;
}

export const walletTypesLeft = (used: readonly string[]) => CRYPTO_TYPES.filter((t) => !used.includes(t));

/** An address shortened for lists. */
export const shortAddress = (a: string) => (a.length > 18 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);
