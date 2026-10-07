import { policy } from "./policy/current";

/** Money and dates, formatted one way everywhere. */
const FALLBACK = "—";

/** `currency` defaults to the base currency from the policy (LSL until the backend says otherwise). */
export function money(amount: number | string | null | undefined, currency: string = policy("app.base_currency")): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n === null || n === undefined || Number.isNaN(n)) return FALLBACK;
  return `${currency} ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const number = (n: number | null | undefined) => (n === null || n === undefined ? FALLBACK : n.toLocaleString("en-ZA"));

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function date(v: string | Date | null | undefined): string {
  const d = toDate(v);
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : FALLBACK;
}

export function dateTime(v: string | Date | null | undefined): string {
  const d = toDate(v);
  return d ? `${date(d)}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : FALLBACK;
}

/** "paid_in_full" -> "Paid in full". */
export const label = (s: string | null | undefined) => (s ? s.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()) : FALLBACK);
