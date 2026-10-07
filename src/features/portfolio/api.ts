import { api } from "@/platform/api/http";

/** One function per backend call. Paths are relative to /api. */

export type Subscription = {
  subscription_id: string | null;
  num_shares: number;
  share_class: string;
  total_amount: string | number;
  amount_paid: string | number;
  payment_method: string | null;
  payment_status: string | null;
  status: string;
  certificate_number: string | null;
  payment_deadline: string | null;
  created_at: string | null;
};
export type Payment = { id: number; payment_reference: string | null; amount: number; payment_method: string | null; payment_date: string | null; status: string; notes: string | null };
export type SubscriptionDetail = {
  subscription: {
    subscription_id: string; full_name: string; num_shares: number; share_class: string; total_amount: number; amount_paid: number;
    payment_method: string | null; payment_status: string | null; status: string; created_at: string | null;
  };
  payments: Payment[];
  certificate: { certificate_number: string; issue_date: string | null; status: string; signed_at: string | null } | null;
};
export type CertificateRequest = { id: number; subscription_id: string; status: string; requested_at: string };
export type BankAccount = { account_name: string; bank_name: string; account_number: string; branch_code: string; branch_name: string | null; swift_code: string | null; currency: string; description: string | null };
export type Availability = { remaining: number; price_per_share: number | string; min_subscription: number; max_subscription: number };
export type BoardOptions = { share_classes: import("./logic").ShareClass[]; board_member_status: string };
export type Profile = { full_name: string; email: string; phone: string; id_number: string };
export type SubscribeResult = { subscription_id: string | null; num_shares: number; total_amount: number | string; payment_method: string; installment_plan: string | null; monthly_payment: number | string | null };

export const getSubscriptions = () => api.get<{ subscriptions: Subscription[] }>("/subscriptions/core/my-public-subscriptions");
export const getDetail = (id: string) => api.get<SubscriptionDetail>(`/subscriptions/core/subscription/${id}/details`);
export const getRequests = () => api.get<{ requests: CertificateRequest[] }>("/certificate-requests/my-requests");
export const requestCertificate = (subscription_id: string) => api.post("/certificate-requests/request-certificate", { subscription_id });

export const getBank = () => api.get<BankAccount>("/bank-accounts/get-default-bank-account", { currency: "LSL" });
export const getCryptos = () => api.get<{ available_cryptos: { crypto_type: string; network_info: string | null }[] }>("/crypto-wallets/available");
export const getWallet = (type: string) => api.get<{ crypto_type: string; wallet_address: string; network_info: string | null }>(`/crypto-wallets/${type}/details`);

export const uploadProof = ({ id, file }: { id: string; file: File }) => {
  const body = new FormData();
  body.append("file", file);
  return api.post("/subscriptions/payments/upload-payment-proof", body, { subscription_id: id });
};

export const downloadCertificate = (number: string) => api.file(`/subscriptions/certificates/certificate/${number}/download`);
export const downloadReceipt = (id: string) => api.file(`/subscriptions/documents/payment-receipt/${id}`);
export const downloadWelcome = (id: string) => api.file(`/subscriptions/documents/welcome-letter/${id}`);

export const getAvailability = () => api.get<Availability>("/subscriptions/core/availability");
export const getBoardOptions = () => api.get<BoardOptions>("/board/investment-options");
export const getProfile = () => api.get<Profile>("/users/profile");
export const subscribe = (body: Profile & { num_shares: number; payment_method: "one-time" | "installment"; installment_plan?: string; tracking_token?: string }) =>
  api.post<SubscribeResult>("/subscriptions/core/subscribe", body);
export const boardInvest = (body: { num_shares: number; share_class: string; payment_method: string; installment_months?: number }) =>
  api.post<{ subscription: { id: number; subscription_id: string | null; num_shares: number; share_class: string; total_amount: number | string } }>("/board/invest", body);
export const trackInviteClick = (token: string) => api.post(`/investor-invitations/track-click/${token}`);
