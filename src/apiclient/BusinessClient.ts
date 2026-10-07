import { Apiclient } from "./Apiclient";
import type { RequestParams } from "./http-client";

export interface EngagementStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  avg_opens_per_email: number;
  recent_sends: Record<string, unknown>[];
  total_eligible_recipients: number;
}

export interface EngagementConfigModel {
  auto_send_enabled: boolean;
  send_time?: string | null;
  default_channels: string[];
}

export interface DraftListItem {
  id: number;
  recipient_name: string;
  recipient_email: string;
  subject_line: string;
  status: string;
  scheduled_send_date?: string | null;
  created_at: string;
}

export interface EmailDraft extends Omit<DraftListItem, "id"> {
  id: string;
  recipient_user_id: string;
  feature_id: string;
  feature_name: string;
  email_html: string;
  ai_greeting: string;
  company_update: string;
  approved_at?: string | null;
  approved_by_user_id?: string | null;
  sent_at?: string | null;
}

export interface FeatureHighlight {
  id: string;
  name: string;
  description: string;
  detailed_explanation: string;
  feature_image_url?: string | null;
  cta_text: string;
  cta_url: string;
  category: string;
  is_active: boolean;
  times_sent: number;
  last_sent_at?: string | null;
}

/** Explicit contracts for registered business routes missing from the older generated client. */
export class BusinessClient<SecurityDataType = unknown> extends Apiclient<SecurityDataType> {
  get_engagement_stats = (params: RequestParams = {}) =>
    this.request<EngagementStats>({ ...params, path: "/stats", method: "GET", secure: true });

  get_engagement_config = (params: RequestParams = {}) =>
    this.request<EngagementConfigModel>({ ...params, path: "/engagement-config", method: "GET", secure: true });

  list_drafts = (query: { status?: string; scheduled_date?: string } = {}, params: RequestParams = {}) =>
    this.request<DraftListItem[]>({ ...params, path: "/drafts", method: "GET", query, secure: true });

  get_draft = ({ draftId }: { draftId: number }, params: RequestParams = {}) =>
    this.request<EmailDraft>({ ...params, path: `/drafts/${encodeURIComponent(draftId)}`, method: "GET", secure: true });

  list_feature_highlights = (query: { active_only?: boolean; category?: string } = {}, params: RequestParams = {}) =>
    this.request<FeatureHighlight[]>({ ...params, path: "/features", method: "GET", query, secure: true });

  get_next_feature = (params: RequestParams = {}) =>
    this.request<FeatureHighlight>({ ...params, path: "/features/next", method: "GET", secure: true });
}
