import { api } from "@/platform/api/http";

export type Requirement = {
  id: number;
  name: string;
  description: string | null;
  jurisdictions: string[];
  is_required: boolean;
  requires_template: boolean;
  validity_period_days: number | null;
  display_order: number;
  template_file_name: string | null;
};

export type Submission = {
  id: number;
  status: string;
  file_name: string | null;
  submitted_at: string | null;
  rejection_reason: string | null;
  review_notes: string | null;
  expires_at: string | null;
};

export type ChecklistItem = {
  requirement: Requirement;
  submission: Submission | null;
  is_required: boolean;
  is_complete: boolean;
  days_until_expiry: number | null;
};

export type Checklist = { jurisdiction: string; items: ChecklistItem[] };

export type ReviewItem = {
  document_id: number;
  board_member_id: number;
  board_member_name: string;
  board_member_email: string;
  requirement_id: number;
  requirement_name: string;
  file_name: string;
  file_size_kb: number;
  submitted_at: string;
  resubmission_count: number;
  status: string;
};

export type MemberStatus = {
  board_member_id: number;
  full_name: string;
  position: string;
  email: string;
  total_required: number;
  total_submitted: number;
  total_approved: number;
  total_rejected: number;
  completion_percentage: number;
  last_activity: string | null;
};

export type Readiness = {
  overall_compliance: number;
  jurisdictions: { jurisdiction: string; total_board_members: number; fully_compliant_members: number; compliance_percentage: number; critical_missing_documents: string[] }[];
};

export type RequirementSetting = { requirement_id: number; default_severity: string };

/** What the requirement editor saves. */
export type RequirementBody = Omit<Requirement, "id" | "template_file_name">;

export const getChecklist = () => api.get<Checklist>("/board-documents/checklist");
export const getReviewQueue = () => api.get<ReviewItem[]>("/board-documents/review-queue");
export const getMembers = () => api.get<MemberStatus[]>("/board-documents/all-members-status");
export const getReadiness = () => api.get<Readiness>("/board-documents/readiness-report");
export const getRequirements = () => api.get<Requirement[]>("/board-documents/requirements");
export const getSettings = () => api.get<RequirementSetting[]>("/board-documents/settings");

const form = (file: File) => {
  const f = new FormData();
  f.append("file", file);
  return f;
};

export const uploadDocument = (v: { requirementId: number; file: File }) =>
  api.post("/board-documents/upload", form(v.file), { requirement_id: v.requirementId });
export const resubmitDocument = (v: { documentId: number; file: File }) =>
  api.put(`/board-documents/${v.documentId}/resubmit`, form(v.file));
export const downloadTemplate = (requirementId: number) => api.file(`/board-documents/requirements/${requirementId}/download-template`);
export const downloadDocument = (documentId: number) => api.file(`/board-documents/documents/${documentId}/download`);

export const reviewDocument = (v: { documentId: number; action: "approve" | "reject"; reason?: string }) =>
  api.put(`/board-documents/review/${v.documentId}`, { action: v.action, rejection_reason: v.reason });

export const saveRequirement = async (v: { id?: number; body: Partial<RequirementBody>; severity: string; template?: File | null }) => {
  const saved = v.id
    ? await api.put<Requirement>(`/board-documents/requirements/${v.id}`, v.body)
    : await api.post<Requirement>("/board-documents/requirements", v.body);
  await api.put(`/board-documents/settings/${saved.id}`, { default_severity: v.severity });
  if (v.template) await api.post(`/board-documents/requirements/${saved.id}/upload-template`, form(v.template));
  return saved;
};
export const removeRequirement = (id: number) => api.delete(`/board-documents/requirements/${id}`);

export const remind = (v: { memberId: number; requirementIds: number[]; message?: string }) =>
  api.post("/board-documents/send-individual-document-request", { board_member_id: v.memberId, requirement_ids: v.requirementIds, message: v.message });
export const remindAll = (requirementIds: number[]) =>
  api.post("/board-documents/broadcast-document-request", { requirement_ids: requirementIds, channel: "email" });
