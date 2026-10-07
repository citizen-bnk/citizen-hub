import { api } from "@/platform/api/http";

// --- investor side
export type Access = { has_access: boolean; ncnda_signed: boolean; terms_signed: boolean; loi_agreed: boolean; missing_agreements: string[] };
export type Ncnda = { version: string; content: string; effective_date: string };
export type InvestorDoc = {
  id: number; category_id: number | null; category_name: string | null; document_name: string; file_size: number | null;
  version: string; description: string | null; is_required_for_license: boolean;
};
export type Opened = { file_url: string; document_name: string; access_logged: boolean };

export const checkAccess = () => api.get<Access>("/data-room/investor/check-access");
export const myStatus = () => api.get<import("./logic").MyStatus>("/data-room/investor/agreements/my-status");
export const currentNcnda = () => api.get<Ncnda>("/data-room/investor/agreements/ncnda/current");
export const investorDocuments = () => api.get<InvestorDoc[]>("/data-room/investor/documents");
export const openDocument = (v: { id: number; reason: string }) =>
  api.post<Opened>(`/data-room/investor/document/${v.id}/access`, { access_reason: v.reason });
export const fetchByKey = (key: string) => api.file(`/image-management/serve/${key}`);

export type Signed = { success: boolean; agreement_type: string; signed_at: string };
export const signNcnda = (body: { agreement_version: string; digital_signature: string }) => api.post<Signed>("/data-room/investor/agreements/sign-ncnda", body);
export const signTerms = (body: { agreement_version: string; digital_signature: string }) => api.post<Signed>("/data-room/investor/agreements/sign-terms", body);
export const agreeLoi = (body: Record<string, string>) => api.post<Signed>("/data-room/investor/agreements/agree-loi", body);

// --- office side
export type Category = { id: number; category_name: string; description: string | null; display_order: number; parent_category_id: number | null; created_at: string };
export type AdminDoc = InvestorDoc & { file_url: string; uploaded_by: string; uploaded_at: string; status: string };
export type CategoryBody = { category_name: string; description: string | null; display_order: number };

export const categories = () => api.get<Category[]>("/data-room/admin/categories");
export const adminDocuments = () => api.get<{ documents: AdminDoc[]; total: number }>("/data-room/admin/documents");
export const createCategory = (b: CategoryBody) => api.post<Category>("/data-room/admin/categories", b);
export const updateCategory = (v: { id: number } & CategoryBody) => api.put<Category>(`/data-room/admin/categories/${v.id}`, v);
export const deleteCategory = (id: number) => api.delete(`/data-room/admin/categories/${id}`);
export const uploadDocument = (form: FormData) => api.post<{ id: number }>("/data-room/admin/documents", form);
export const deleteDocument = (id: number) => api.delete(`/data-room/admin/documents/${id}`);

export type AccessLog = { id: number; user_id: string; document_id: number; document_name: string; accessed_at: string; access_reason: string | null; ip_address: string | null; user_agent: string | null };
export type DocStat = { document_id: number; document_name: string; category_name: string | null; total_accesses: number; unique_users: number; last_accessed: string | null };
export type SignedAgreement = { id: number; user_id: string; agreement_type: string; signed_at: string; agreement_version: string | null; ip_address: string | null };
export type PendingUser = { user_id: string; missing_agreements: string[]; has_subscriptions: boolean; has_board_investments: boolean };
export type LoiSubmission = { id: number; user_id: string; file_url: string | null; submitted_at: string; status: string; reviewed_by: string | null; reviewed_at: string | null; notes: string | null };

export const accessLogs = () => api.get<{ logs: AccessLog[]; total: number }>("/data-room/audit/access-logs", { limit: 200 });
export const documentStats = () => api.get<{ stats: DocStat[]; total_documents: number }>("/data-room/audit/document-stats");
export const signedAgreements = () => api.get<{ agreements: SignedAgreement[]; total: number }>("/data-room/audit/agreements", { limit: 200 });
export const pendingAgreements = () => api.get<{ pending_users: PendingUser[]; total: number }>("/data-room/audit/pending-agreements");
export const loiSubmissions = () => api.get<{ submissions: LoiSubmission[]; total: number }>("/data-room/audit/loi-submissions");
export const reviewLoi = (v: { id: number; status: "approved" | "rejected"; notes: string | null }) =>
  api.put(`/data-room/audit/loi-submissions/${v.id}/review`, { status: v.status, notes: v.notes });
