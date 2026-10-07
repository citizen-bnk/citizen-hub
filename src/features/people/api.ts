import { api } from "@/platform/api/http";
import type { InvitableRole } from "./logic";

/** ---- Invitations (back_office_board, invitation_permissions) ---- */

export type Invitation = {
  id: number; email: string; full_name?: string | null; role: string; status: string; position?: string | null;
  invited_by_name?: string | null; created_at: string; expires_at?: string | null; accepted_at?: string | null;
  reminder_metadata?: { reminder_count: number; last_reminder_sent_at: string | null };
};
export type InviteBody = { full_name: string; email: string; role: InvitableRole; position?: string; message?: string; expires_at?: string };

export const listInvitations = () => api.get<{ invitations: Invitation[] }>("/back-office/invitations");
export const checkCanInvite = (role: string) => api.get<{ can_invite: boolean; reason: string }>(`/invitation-permissions/check/${role}`);
export const createInvitation = (body: InviteBody) =>
  api.post<{ success: boolean; message: string; duplicate_prevented?: boolean; email_warning?: boolean }>("/back-office/invitations/create", body);
export const resendInvitation = (id: number) => api.post<{ success: boolean }>(`/back-office/invitations/${id}/resend-email`);
export const cancelInvitation = (id: number) => api.delete<{ success: boolean }>(`/back-office/invitations/${id}`);

/** ---- Investor leads (investor_leads, investor_invitations) ---- */

export type Lead = {
  id: number; full_name: string; email: string; phone: string | null; company: string | null; country: string; lead_source: string;
  investment_interest_amount: number | null; preferred_share_class: string | null; status: string; notes: string | null;
  created_at: string; latest_activity: string | null; invitation_count: number;
};
export type LeadAnalytics = {
  total_leads: number; leads_by_status: Record<string, number>; leads_by_source: Record<string, number>; conversion_rate: number;
  avg_days_to_conversion: number | null; recent_conversions: number; total_invited: number; invitation_response_rate: number;
};
export type LeadInput = { full_name: string; email: string; country: string; phone?: string; company?: string; lead_source?: string; notes?: string };
export type LeadInvite = { share_class: string; minimum_investment: number; special_terms?: string };
export type ImportSummary = { total_rows: number; successful: number; failed: number; errors: { row: string; error: string }[] };

export const listLeads = (q: { status?: string; search?: string }) => api.get<Lead[]>("/investor-leads/list", { ...q, limit: 100 });
export const leadAnalytics = () => api.get<LeadAnalytics>("/investor-leads/analytics");
export const createLead = (body: LeadInput) => api.post<Lead>("/investor-leads/create", body);
export const importLeads = (csv: string) => {
  const form = new FormData();
  form.append("file", new Blob([csv], { type: "text/csv" }), "leads.csv");
  return api.post<ImportSummary>("/investor-leads/bulk-import", form);
};
export const inviteLeads = (ids: number[], terms: LeadInvite) =>
  ids.length === 1
    ? api.post("/investor-invitations/send", { lead_id: ids[0], ...terms })
    : api.post("/investor-invitations/bulk-send", { lead_ids: ids, ...terms });

/** ---- Users and roles (user_management, role_management, user_activity_tracking) ---- */

export type UserRow = {
  user_id: string; email: string | null; full_name: string | null; phone: string | null; status: string; account_type: string | null;
  created_at: string | null; profile_completion_percentage: number; roles: string[];
};
export type UserList = { users: UserRow[]; total: number; page: number; page_size: number; total_pages: number };
export type LoginHistory = {
  total_logins: number; successful_logins: number; failed_logins: number; last_login: string | null;
  login_events: { id: number; login_timestamp: string; ip_address: string | null; location_city: string | null; location_country: string | null; success: boolean; failure_reason: string | null }[];
};
export type SuspensionHistory = {
  total_suspensions: number; current_status: string;
  suspension_events: { id: number; action: string; reason: string | null; suspended_by_name: string | null; suspended_at: string }[];
};
export type RoleHistory = {
  total_changes: number; current_roles: string[];
  role_events: { id: number; role_name: string; action: string; performed_by_name: string | null; reason: string | null; changed_at: string }[];
};

export const listUsers = (q: { page: number; status?: string }) => api.get<UserList>("/users/admin/list", { page: q.page, page_size: 50, status: q.status });
export const searchUsers = (query: string) => api.get<{ users: UserRow[]; total: number }>("/users/admin/search", { query });
export const allRoles = () => api.get<{ id: number; role_name: string; description: string | null }[]>("/roles/all");
export const assignRole = (b: { user_id: string; role_name: string }) => api.post<{ roles: string[] }>("/roles/assign", b);
export const removeRole = (b: { user_id: string; role_name: string }) => api.post<{ roles: string[] }>("/roles/remove", b);
export const suspendUser = (b: { user_id: string; reason: string }) => api.post(`/users/admin/${b.user_id}/suspend`, { reason: b.reason });
export const reactivateUser = (user_id: string) => api.post(`/users/admin/${user_id}/reactivate`);
export const loginHistory = (id: string) => api.get<LoginHistory>(`/user-activity/login-history/${id}`);
export const suspensionHistory = (id: string) => api.get<SuspensionHistory>(`/user-activity/suspension-history/${id}`);
export const roleHistory = (id: string) => api.get<RoleHistory>(`/user-activity/role-history/${id}`);

/** ---- Dashboard numbers (back_office_board) ---- */

export type SystemStats = {
  board_members: { active: number; total: number }; invitations: { pending: number; total: number };
  subscriptions: { active: number; total_invested: number; total: number }; crypto_wallets: { active: number; total: number };
  documents: { pending: number; total: number };
};
export const systemStats = () => api.get<SystemStats>("/back-office/dashboard/stats");
