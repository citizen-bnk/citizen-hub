import { api } from "@/platform/api/http";
import { ApiError } from "@/platform/api/errors";
import type { Prefs, TodoFeed } from "./logic";

export type Profile = Record<string, string | number | boolean | null> & {
  user_id: string; email: string; full_name: string; phone: string; id_number: string; account_type: string; status: string;
  version: number; email_verified: boolean | null; mobile_verified: boolean | null; profile_completion_percentage: number | null;
};

export const getProfile = () => api.get<Profile>("/users/profile");
export const saveProfile = (body: Record<string, unknown>) => api.put<Profile>("/users/profile", body);
export const registerProfile = (body: Record<string, unknown>) => api.post<Profile>("/users/register", body);

export const getPrefs = () => api.get<Prefs>("/notification-preferences/my-preferences");
export const savePrefs = (body: Record<string, unknown>) => api.put<Prefs>("/notification-preferences/my-preferences", body);

export type Contact = { contact_type: "email" | "mobile"; contact_value: string };
export const sendCode = (c: Contact) => api.post("/otp/send", c);
export const verifyCode = (c: Contact & { otp_code: string }) => api.post("/otp/verify", c);

/** The to-do feed: the notifications and pending invitations. A person with no profile yet gets a 404 from notifications. */
export async function getTodoFeed(): Promise<TodoFeed> {
  const [notes, invitations] = await Promise.all([
    api.get<{ notifications: TodoFeed["notifications"] }>("/notifications", { limit: 10, unread_only: true }).then(
      (r) => ({ ...r, profileMissing: false }),
      (e: unknown) => {
        if (e instanceof ApiError && e.kind === "not_found") return { notifications: [], profileMissing: true };
        throw e;
      },
    ),
    api.get<TodoFeed["invitations"]>("/user/invitations/pending"),
  ]);
  return { profileMissing: notes.profileMissing, notifications: notes.notifications, invitations };
}
export const markRead = (id: number) => api.post("/mark-read", { notification_ids: [id] });
