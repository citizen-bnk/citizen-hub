import { api } from "@/platform/api/http";

export type Investment = { meets_requirement: boolean; total_shares: number; required_shares: number; shares_needed: number; investment_needed: number };
export type DocumentCompliance = { total_required: number; uploaded: number; approved: number; missing: number; pending_review: number; compliance_percentage: number };

export type Member = {
  board_member_id: number;
  user_id: string | null;
  full_name: string;
  email: string;
  position_name: string | null;
  position_level: number | null;
  minimum_investment_shares: number | null;
  appointed_at: string | null;
  term_end_date: string | null;
  status: string | null;
  investment_status: Investment | null;
  profile_completion_percentage: number | null;
  document_compliance: DocumentCompliance | null;
};

export type Position = { id: number; position_name: string; position_level: number; description: string | null; created_at: string };
export type HistoryEntry = {
  id: number; board_member_id: number; board_member_name: string; position_name: string; position_level: number;
  appointed_at: string; ended_at: string | null; term_end_date: string | null; appointed_by_name: string | null; is_current: boolean; notes: string | null;
};
export type Unmapped = { board_member_id: number; email: string; full_name: string; position: string; appointed_date: string; status: string };
export type AvailableUser = { user_id: string; email: string; full_name: string; account_type: string };

export type Dashboard = {
  profile: { position: string; appointed_date: string; term_end_date: string | null; status: string; total_shares: number; board_member_id: number } | null;
};

export const getMembers = () => api.get<{ members: Member[] }>("/board-positions/members-with-investment").then((r) => r.members);
export const getPositions = () => api.get<{ positions: Position[] }>("/board-positions").then((r) => r.positions);
export const getHistory = (memberId?: number) =>
  api.get<{ history: HistoryEntry[] }>("/board-positions/history", memberId ? { member_id: memberId } : undefined).then((r) => r.history);
export const getUnmapped = () => api.get<{ unmapped_members: Unmapped[] }>("/board-mapping/unmapped-members").then((r) => r.unmapped_members);
export const getAvailableUsers = () => api.get<{ users: AvailableUser[] }>("/board-mapping/available-users").then((r) => r.users);
export const getDashboard = () => api.get<Dashboard>("/board/dashboard");

export const appoint = (v: { user_id: string; position: string; position_id?: number; term_years: number }) => api.post("/back-office/board/appoint", v);
export const updateMember = (v: { userId: string; position?: string; term_end_date?: string; status?: string }) =>
  api.put(`/back-office/board/members/${v.userId}`, { position: v.position || undefined, term_end_date: v.term_end_date || undefined, status: v.status });
export const removeMember = (userId: string) => api.delete(`/back-office/board/members/${userId}`);
export const syncAccounts = () => api.post<{ successfully_mapped: number; total_unmapped: number }>("/board-mapping/auto-sync");
export const linkAccount = (v: { board_member_id: number; user_id: string }) => api.post("/board-mapping/map-manually", v);

export const createPosition = (v: { position_name: string; position_level: number; description?: string }) => api.post("/board-positions", v);
export const updatePosition = (v: { id: number; position_name: string; position_level: number; description?: string }) =>
  api.put(`/board-positions/${v.id}`, { position_name: v.position_name, position_level: v.position_level, description: v.description });
export const assignPosition = (v: { memberId: number; position_id: number; term_end_date?: string; notes?: string }) =>
  api.post(`/board-positions/members/${v.memberId}/assign`, { position_id: v.position_id, term_end_date: v.term_end_date || undefined, notes: v.notes || undefined });
