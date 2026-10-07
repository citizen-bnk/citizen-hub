import { useQuery } from "@tanstack/react-query";
import { useInbox } from "@/platform/notifications";
import { useProfile } from "@/platform/profile";
import { getPrefs, pendingInvitations } from "./api";
import { buildTodo } from "@/platform/notifications/logic";

export const usePrefs = () => useQuery({ queryKey: ["notifications", "prefs"], queryFn: getPrefs });

/** The to-do list: the same inbox, plus the two things that are not inbox rows (no profile yet, invitations waiting). */
export function useTodo() {
  const profile = useProfile();
  const invitations = useQuery({ queryKey: ["notifications", "invitations"], queryFn: pendingInvitations, staleTime: 60_000, meta: { silent: true } });
  const unread = useInbox({ unreadOnly: true, limit: 10 });
  const ready = !profile.isPending && !invitations.isPending && !unread.isPending;
  return {
    ready,
    error: unread.error,
    refetch: unread.refetch,
    items: ready
      ? buildTodo({ profileMissing: profile.isError && profile.error?.kind === "not_found", invitations: invitations.data ?? [], unread: unread.data?.items ?? [] })
      : [],
  };
}
