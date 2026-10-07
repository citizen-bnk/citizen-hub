import { api } from "@/platform/api/http";
import { ApiError } from "@/platform/api/errors";

export type MeetingType = "regular" | "special" | "emergency" | "agm" | "egm";
export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "postponed";

export type Meeting = {
  id: string;
  title: string;
  meeting_type: MeetingType;
  meeting_date: string; // 2026-10-20
  meeting_time: string; // 14:00:00
  location: string | null;
  virtual_link: string | null;
  description: string | null;
  status: MeetingStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  agenda_count: number;
  attendance_count: number;
  has_minutes: boolean;
};

export type AgendaItem = {
  id: string;
  meeting_id: string;
  item_number: number;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  presenter: string | null;
  attachments: unknown[];
  created_at: string;
};

export type Minutes = {
  id: string;
  meeting_id: string;
  content: string;
  recorded_by: string;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type AttendanceStatus = "present" | "absent" | "excused" | "late";
export type Attendance = {
  id: string;
  meeting_id: string;
  board_member_id: string;
  status: AttendanceStatus;
  arrival_time: string | null;
  departure_time: string | null;
  notes: string | null;
};

export type Rsvp = "pending" | "accepted" | "declined" | "tentative";
export type Invitee = {
  id: string;
  meeting_id: string;
  board_member_id: string;
  email: string;
  invited_by: string;
  invitation_sent_at: string | null;
  rsvp_status: Rsvp;
  rsvp_at: string | null;
  created_at: string;
};

export type Priority = "low" | "medium" | "high" | "urgent";
export type ActionStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type ActionItem = {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  due_date: string | null;
  status: ActionStatus;
  priority: Priority;
  completed_at: string | null;
  completed_by: string | null;
};

export type BoardMember = { user_id: string; full_name: string; email: string; position: string | null };

export type MeetingInput = {
  title: string;
  meeting_type: MeetingType;
  meeting_date: string;
  meeting_time: string;
  location?: string | null;
  virtual_link?: string | null;
  description?: string | null;
};

/** Everything the meeting screen shows, loaded together so its tabs share one query. */
export type MeetingBundle = {
  meeting: Meeting;
  agenda: AgendaItem[];
  minutes: Minutes | null;
  attendance: Attendance[];
  invitees: Invitee[];
  actions: ActionItem[];
};

const notFoundAsNull = (e: unknown) => {
  if (e instanceof ApiError && e.kind === "not_found") return null;
  throw e;
};

export const listMeetings = (status?: string) => api.get<{ meetings: Meeting[]; total_count: number }>("/board-meetings/list", { status });

export async function loadMeeting(id: string): Promise<MeetingBundle> {
  const [meeting, agenda, minutes, attendance, invitees, actions] = await Promise.all([
    api.get<Meeting>(`/board-meetings/${id}`),
    api.get<AgendaItem[]>(`/board-meetings/${id}/agenda`),
    api.get<Minutes>(`/board-meetings/${id}/minutes`).catch(notFoundAsNull),
    api.get<Attendance[]>(`/board-meetings/${id}/attendance`),
    api.get<Invitee[]>(`/board-meetings/${id}/invitees`),
    api.get<ActionItem[]>(`/board-meetings/${id}/action-items`),
  ]);
  return { meeting, agenda, minutes, attendance, invitees, actions };
}

export const boardMembers = () => api.get<BoardMember[]>("/board-meetings/board-members");

export const createMeeting = (body: MeetingInput) => api.post<Meeting>("/board-meetings/create", body);
export const inviteMembers = (id: string, board_member_ids: string[]) => api.post(`/board-meetings/${id}/invite`, { board_member_ids, send_email: true });
export const updateMeeting = (id: string, body: Partial<MeetingInput> & { status?: MeetingStatus }) => api.put<Meeting>(`/board-meetings/${id}`, body);
export const cancelMeeting = (id: string) => api.delete(`/board-meetings/${id}`);
export const addAgendaItem = (id: string, body: { item_number: number; title: string; description?: string; duration_minutes?: number; presenter?: string }) =>
  api.post<AgendaItem>(`/board-meetings/${id}/agenda`, body);
export const recordMinutes = (id: string, content: string) => api.post<Minutes>(`/board-meetings/${id}/minutes`, { content });
export const approveMinutes = (id: string) => api.put<Minutes>(`/board-meetings/${id}/minutes/approve`);
export const markAttendance = (id: string, body: { board_member_id: string; status: AttendanceStatus; notes?: string }) =>
  api.post<Attendance>(`/board-meetings/${id}/attendance`, body);
export const rsvp = (id: string, rsvp_status: Exclude<Rsvp, "pending">) => api.put<Invitee>(`/board-meetings/${id}/rsvp`, { rsvp_status });
// The backend matches these ids against the invitees' board_member_id, not the invitee row id.
export const resendInvitations = (id: string, invitee_ids: string[]) =>
  api.post<{ success: boolean; resent_count: number; failed_count: number; errors: string[] }>(`/board-meetings/${id}/resend-invitations`, { invitee_ids });
export const createActionItem = (id: string, body: { title: string; assigned_to: string; description?: string; due_date?: string; priority: Priority }) =>
  api.post<ActionItem>(`/board-meetings/${id}/action-items`, body);
export const updateActionItem = (itemId: string, body: { status?: ActionStatus }) => api.put<ActionItem>(`/board-meetings/action-items/${itemId}`, body);
