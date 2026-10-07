import { api } from "@/platform/api/http";

export type Prefs = { channel_email: boolean };

export const getPrefs = () => api.get<Prefs>("/notification-preferences/my-preferences");
export const savePrefs = (body: Prefs) => api.put<Prefs>("/notification-preferences/my-preferences", body);

export type Invitation = { token: string; role: string; invited_by_name: string | null };
export const pendingInvitations = () => api.get<Invitation[]>("/user/invitations/pending");
