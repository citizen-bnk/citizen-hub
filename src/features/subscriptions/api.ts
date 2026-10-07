import { api } from "@/platform/api/http";
import type { NewSubscription, ShareClass } from "./logic";

type Raw = Record<string, unknown>;

export type Payment = {
  id: number; payment_reference: string; amount: number; payment_method: string; payment_date: string | null;
  status: string; verified_by: string | null; verified_at: string | null; notes: string | null;
};
export type BoardMember = { user_id: string; full_name: string; position: string; status: string };

/** Everyone's subscriptions (back office). */
export const listAll = () => api.get<{ total_subscriptions: number; subscriptions: Raw[] }>("/subscriptions/core/subscriptions");
/** Subscriptions this person created on behalf of investors (admins). */
export const listMine = () => api.get<{ subscriptions: Raw[] }>("/my-created-subscriptions");
/** Board members' subscriptions (super admin). */
export const listBoard = () => api.get<{ subscriptions: Raw[] }>("/back-office/board/investments/all");
export const boardMembers = () => api.get<{ members: BoardMember[] }>("/back-office/board/members");
export const shareClasses = () => api.get<{ classes: ShareClass[] }>("/share-classes");
export const paymentHistory = (id: string) => api.get<{ payments: Payment[] }>(`/subscriptions/payments/payment-history/${id}`);
export const findUsers = (query: string) =>
  api.get<{ users: { user_id: string; email: string; full_name: string | null; phone: string | null }[] }>("/users/admin/search", { query });

// Payments. Recording goes through the finance route (back office), not the admin-only "created on behalf" one.
export const verifyProof = (v: { id: string; approved: boolean; notes?: string }) =>
  api.post("/subscriptions/payments/verify-payment", undefined, { subscription_id: v.id, approved: v.approved, notes: v.notes });
export const recordPayment = (v: { subscription_id: string; amount: number; payment_reference: string }) =>
  api.post("/subscriptions/payments/record-payment", v);
export const uploadProof = (v: { id: string; file: File }) => {
  const body = new FormData();
  body.append("file", v.file);
  return api.post(`/upload-admin-payment-proof/${v.id}`, body);
};

// Documents and certificate.
export const issueCertificate = (id: string) => api.post<{ message: string }>("/subscriptions/certificates/issue-certificate", { subscription_id: id });
export const receiptPdf = (id: string) => api.file(`/subscriptions/documents/payment-receipt/${id}`);
export const welcomeLetterPdf = (id: string) => api.file(`/subscriptions/documents/welcome-letter/${id}`);

// Board subscriptions only (super admin).
export const transferMember = (v: { boardId: number; target_user_id: string; num_shares: number }) =>
  api.post(`/back-office/board/investments/${v.boardId}/transfer-member`, { target_user_id: v.target_user_id, num_shares: v.num_shares });
export const transferClass = (v: { boardId: number; target_share_class: string; num_shares: number }) =>
  api.post(`/back-office/board/investments/${v.boardId}/transfer-class`, { target_share_class: v.target_share_class, num_shares: v.num_shares });
export const cancelBoard = (boardId: number) => api.delete(`/back-office/board/investments/${boardId}/cancel`);

// New subscription on behalf of an investor.
export const createOnBehalf = (v: NewSubscription) =>
  api.post<{ subscription_id: string; user_existed: boolean; invitation_created: boolean; message: string }>("/create-on-behalf", v);
