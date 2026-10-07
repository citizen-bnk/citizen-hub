import { api } from "@/platform/api/http";

// ---- campaigns (board_engagement) ------------------------------------------------------------------------------------

export type Feature = {
  id: string; name: string; description: string; detailed_explanation: string; feature_image_url: string | null;
  cta_text: string; cta_url: string; category: string; is_active: boolean; times_sent: number; last_sent_at: string | null;
};
export type FeatureBody = Pick<Feature, "name" | "description" | "detailed_explanation" | "cta_text" | "cta_url" | "category" | "feature_image_url">;
export type Draft = {
  id: number; recipient_name: string; recipient_email: string; subject_line: string; status: string;
  scheduled_send_date: string | null; created_at: string;
};
export type DraftDetail = Draft & { email_html: string; feature_name: string; ai_greeting: string; company_update: string; sent_at: string | null };
export type Stats = {
  total_sent: number; total_opened: number; total_clicked: number; open_rate: number; click_rate: number;
  avg_opens_per_email: number; total_eligible_recipients: number;
  recent_sends: { id: number; recipient_name: string; sent_at: string | null; opened_count: number; clicked_count: number }[];
};
export type EngagementConfig = { auto_send_enabled: boolean; send_time: string | null; default_channels: string[] };
export type SendResult = { sent_count: number; total_drafts: number; message: string; errors?: { draft_id: number; email: string; error: string }[] };
export type GenerateResult = { success: boolean; message: string; drafts_created: number; drafts_failed: number };

export const engagement = {
  stats: () => api.get<Stats>("/stats"),
  config: () => api.get<EngagementConfig>("/engagement-config"),
  saveConfig: (c: EngagementConfig) => api.post<EngagementConfig>("/engagement-config", c),
  features: () => api.get<Feature[]>("/features", { active_only: false }),
  createFeature: (b: FeatureBody) => api.post<Feature>("/features", { ...b, is_active: true }),
  updateFeature: ({ id, ...b }: FeatureBody & { id: string }) => api.put<Feature>(`/features/${id}`, b),
  toggleFeature: (id: string) => api.patch<Feature>(`/features/${id}/toggle`),
  deleteFeature: (id: string) => api.delete(`/features/${id}`),
  generateFeature: (v: { prompt: string; category?: string }) => api.post<{ id: string | null; name: string; message: string }>("/features/generate", { ...v, save_to_database: true }),
  drafts: (status?: string) => api.get<Draft[]>("/drafts", { status }),
  draft: (id: number) => api.get<DraftDetail>(`/drafts/${id}`),
  generateDrafts: () => api.post<GenerateResult>("/scheduled-draft-generation"),
  approve: (v: { ids: number[]; userId: string }) => api.post<{ approved_count: number; message: string }>("/drafts/approve", { draft_ids: v.ids, approved_by_user_id: v.userId }),
  cancel: (id: number) => api.post<{ message: string }>(`/drafts/${id}/cancel`),
  send: (ids: number[]) => api.post<SendResult>("/send", { draft_ids: ids }),
};

// ---- outbox and templates (email_templates) --------------------------------------------------------------------------

export type SentEmail = {
  id: number; email_id: string; queue_id: string; recipient_email: string; recipient_name: string; subject: string; body_html: string;
  template_name: string | null; status: string; sent_at: string | null; sent_by: string; created_at: string; last_error: string | null; retry_count: number;
};
export type QueueStats = { pending: number; retrying: number; sent: number; failed: number; total: number };
export type Template = {
  id: number; template_name: string; category: string; subject: string; template_type: string; function_name: string | null;
  trigger_points: Record<string, unknown>[]; process_flow: string | null; can_edit: boolean; is_active: boolean; usage_count: number;
  created_at: string; updated_at: string;
};

export const mail = {
  queue: () => api.get<{ success: boolean; queue_stats: QueueStats }>("/email-templates/queue/status"),
  sent: (v: { status?: string; search?: string }) =>
    api.post<{ emails: SentEmail[]; total_count: number }>("/email-templates/sent-items/list", { status: v.status || null, search: v.search || null, limit: 100 }),
  retry: (queueId: string) => api.post<{ success: boolean; message: string }>(`/email-templates/queue/retry/${queueId}`),
  templates: () => api.get<Template[]>("/email-templates/registry/list"),
  toggleTemplate: (id: number) => api.post<{ is_active: boolean }>(`/email-templates/registry/toggle-active/${id}`),
  preview: (id: number) => api.post<{ html: string; subject: string }>("/email-templates/registry/preview", { template_id: id }),
  test: (v: { id: number; email: string }) => api.post<{ message: string }>("/email-templates/registry/test", { template_id: v.id, recipient_email: v.email }),
};
