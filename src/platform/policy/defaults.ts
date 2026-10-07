/**
 * What the Hub uses when /api/policy has not answered yet or is down: today's wording and values. The typed keys below are the
 * ones the Hub reads; anything else the backend sends is ignored. Changing a value for real is done in the backend (PUT /policy/{key}),
 * never here, except to keep this fallback in line with the backend seed.
 */
export type ListItem = { code: string; label: string; display_order: number; meta?: Record<string, unknown> | null };
export type PolicyPlan = { code: string; label: string; months: number; audience?: string; display_order: number };

export type PolicyValues = {
  "legal.company_name": string;
  "legal.registration_number": string;
  /** The licence-status sentence: the company applied for a licence and does not carry on banking business. */
  "legal.licence_status": string;
  /** The short form shown in the footer of every page. */
  "legal.footer": string;
  "brand.name": string;
  "app.base_currency": string;
  "app.default_country": string;
  "payments.deadline_days": number | null;
  "payments.reminder_days": number[];
  "invitations.expiry_days": { board: number; investor: number; subscription: number };
  "careers.apply_email": string | null;
  "careers.apply_instructions": string | null;
};
export type PolicyKey = keyof PolicyValues;

export type Snapshot = { version: number; policies: PolicyValues; plans: PolicyPlan[]; lists: Record<string, ListItem[]> };

const item = (code: string, label: string, display_order: number): ListItem => ({ code, label, display_order });

export const DEFAULT_PLANS: PolicyPlan[] = [
  { code: "one-time", label: "Pay in full", months: 1, display_order: 1 },
  { code: "3-months", label: "3 monthly instalments", months: 3, display_order: 2 },
  { code: "6-months", label: "6 monthly instalments", months: 6, display_order: 3 },
  { code: "12-months", label: "12 monthly instalments", months: 12, display_order: 4 },
];

export const DEFAULT_LISTS: Record<string, ListItem[]> = {
  gender: [item("male", "Male", 1), item("female", "Female", 2), item("other", "Other", 3)],
  investor_type: [item("individual", "Individual", 1), item("institutional", "Institution", 2), item("accredited", "Accredited investor", 3)],
  account_type: [item("personal", "Personal", 1), item("business", "Business", 2)],
};

export const DEFAULT_POLICY: Snapshot = {
  version: 0,
  policies: {
    "legal.company_name": "Citizen Digital Ltd",
    "legal.registration_number": "99073",
    "legal.licence_status": "Citizen Digital Ltd (Reg. 99073) is the applicant for a Central Bank of Lesotho banking licence and does not currently carry on banking business.",
    "legal.footer": "Citizen Digital Ltd. Citizen Bank is an applicant for a banking licence from the Central Bank of Lesotho and does not yet carry on banking business.",
    "brand.name": "Citizen Bank",
    "app.base_currency": "LSL",
    "app.default_country": "Lesotho",
    "payments.deadline_days": null,
    "payments.reminder_days": [7, 3, 1],
    "invitations.expiry_days": { board: 7, investor: 30, subscription: 30 },
    "careers.apply_email": null,
    "careers.apply_instructions": null,
  },
  plans: DEFAULT_PLANS,
  lists: DEFAULT_LISTS,
};
