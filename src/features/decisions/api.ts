import { api } from "@/platform/api/http";

export type SessionType = "agm_vote" | "board_resolution" | "board_meeting";
export type SessionStatus = "draft" | "active" | "closed" | "finalized" | "cancelled";

/** A row of governance_sessions, as the backend returns it. */
export type Session = {
  id: number;
  session_type: SessionType;
  title: string;
  description: string | null;
  status: SessionStatus;
  opens_at: string | null;
  closes_at: string | null;
  meeting_date: string | null;
  meeting_location: string | null;
  meeting_link: string | null;
  requires_quorum: boolean;
  quorum_percentage: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Item = { id: number; session_id: number; item_order: number; question: string; description: string | null; item_type: string; options: string[] };
export type MyVote = { id: number; session_id: number; item_id: number | null; vote_value: string; voting_power: number; voted_on_behalf_of: string | null; comments: string | null; voted_at: string };
export type Doc = {
  id: number; session_id: number; document_type: string; file_url: string; file_name: string; file_size: number | null;
  description: string | null; uploaded_by: string; uploaded_at: string; status: string | null;
};
export type SessionDetails = { session: Session; items: Item[]; my_votes: MyVote[]; documents: Doc[] };

/** The tally: results[itemId][voteValue] = {count, voting_power}; item 0 is a resolution without items. */
export type Results = {
  session: Session;
  total_voting_power: number;
  results: Record<string, Record<string, { count: number; voting_power: number }>>;
};

export type PendingAction = {
  action_type: "vote" | "approve_minutes" | "rsvp_meeting";
  /** For approve_minutes this is the id of the document to approve. */
  session_id: number;
  title: string;
  description: string;
  deadline: string | null;
  priority: "normal" | "high" | "urgent";
};

export type HistoryVote = MyVote & { title: string; session_type: SessionType; session_date: string };
export type HistoryApproval = { id: number; approval_type: string; item_id: number; status: string; comments: string | null; approved_at: string | null; file_name: string | null; title: string | null };

export type Proxy = {
  id: number; assignor_id: string; proxy_id: string; scope_type: "all_votes" | "specific_session" | "date_range";
  session_id: number | null; valid_until: string | null; notes: string | null; status: string;
  proxy_name?: string | null; proxy_email?: string | null; assignor_name?: string | null; assignor_email?: string | null;
};
export type ProxyUser = { id: string; name: string | null; email: string };
export type Proxies = { proxies_given: Proxy[]; proxies_received: Proxy[]; available_users: ProxyUser[] };

export type NotifyMember = { user_id: string; full_name: string; email: string; position: string | null };

export type SessionInput = {
  session_type: SessionType; title: string; description?: string | null; opens_at?: string | null; closes_at?: string | null;
  meeting_date?: string | null; meeting_location?: string | null; meeting_link?: string | null;
};
export type ItemInput = { question: string; description?: string | null; options?: string[] };

// Member side
export const pendingActions = () => api.get<{ pending_actions: PendingAction[] }>("/governance/pending-actions").then((r) => r.pending_actions);
export const history = () => api.get<{ votes: HistoryVote[]; approvals: HistoryApproval[] }>("/governance/history");
export const listSessions = () => api.get<{ sessions: Session[] }>("/governance/sessions").then((r) => r.sessions);
export const sessionDetails = (id: number | string) => api.get<SessionDetails>(`/governance/sessions/${id}`);
export const sessionResults = (id: number | string) => api.get<Results>(`/governance/sessions/${id}/results`);
export const myProxies = () => api.get<Proxies>("/governance/my-proxy-assignments");
export const castVote = (body: { session_id: number; item_id: number | null; vote_value: string; comments?: string; voting_as_proxy_for?: string }) => api.post("/governance/vote", body);
export const decideApproval = (body: { item_id: number; status: "approved" | "rejected" | "changes_requested"; comments?: string }) => api.post("/governance/approve", { approval_type: "minutes", ...body });
export const assignProxy = (body: { proxy_id: string; scope_type: "all_votes" | "specific_session"; session_id?: number }) => api.post("/governance/proxy", body);
export const revokeProxy = (id: number) => api.delete(`/governance/proxy/${id}`);

// Back office side
export const createSession = (body: SessionInput) => api.post<{ session_id: number }>("/governance/sessions", body);
export const updateSession = (id: number, body: Partial<SessionInput>) => api.patch(`/governance/sessions/${id}`, body);
export const setSessionStatus = (id: number, status: SessionStatus) => api.patch(`/governance/sessions/${id}/status`, { status });
export const deleteSession = (id: number) => api.delete(`/governance/sessions/${id}`);
export const addItems = (id: number, items: ItemInput[]) => api.post(`/governance/sessions/${id}/items`, { session_id: id, items });
// Replaces every item of a draft session with this list.
export const replaceItems = (id: number, items: ItemInput[]) => api.patch(`/governance/sessions/${id}/items`, { items });
export const addDocument = (body: { session_id: number; document_type: string; file_url: string; file_name: string; description?: string }) => api.post("/governance/documents", body);
export const deleteDocument = (id: number) => api.delete(`/governance/documents/${id}`);
export const notifyCandidates = (id: number) => api.get<NotifyMember[]>(`/governance/sessions/${id}/board-members-for-notification`);
export const notifyMembers = (id: number, member_ids: string[]) =>
  api.post<{ success: boolean; queued_count: number; message: string }>(`/governance/sessions/${id}/send-notifications`, { member_ids });
