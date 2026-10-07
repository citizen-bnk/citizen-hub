import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { features } from "@/features";
import { api } from "../api/http";
import { WEBSITE_URL } from "../config";
import { allScreens, resolveLegacy } from "../registry";
import { type Item, type Link, type RawNotification, linkFor, toItem } from "./logic";

/**
 * The one in-app inbox. The bell, the inbox screen and the Home to-do list all read it, so they always agree. There are no
 * pop-ups: new items show as a number on the bell and in the list. Email is the only other channel (see the settings).
 */
export const INBOX_KEY = ["inbox"] as const;

export type Inbox = { notifications: RawNotification[]; total: number };

export const listInbox = (query: { limit?: number; offset?: number; unread_only?: boolean } = {}) => api.get<Inbox>("/notifications", query);
export const unreadCount = () => api.get<{ count: number }>("/unread-count");
export const markRead = (ids: number[]) => api.post("/mark-read", { notification_ids: ids });
export const markAllRead = () => api.post("/mark-all-read");
export const removeNotification = (id: number) => api.delete(`/${id}`);

const screenPatterns = allScreens(features).map((r) => new RegExp("^" + r.screen.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:[A-Za-z]+/g, "[^/]+") + "$"));
const isHubPath = (p: string) => screenPatterns.some((re) => re.test(p));

/** Turns a backend notification's `metadata.url` into a link inside the Hub (or the website), or nothing. */
export function useLinker(): (url: unknown) => Link | null {
  return useMemo(() => {
    const ctx = {
      hub: window.location.origin,
      website: WEBSITE_URL,
      resolve: (p: string, s: string, h: string) => resolveLegacy(features, p, s, h),
      isHubPath,
    };
    return (url: unknown) => linkFor(url, ctx);
  }, []);
}

/** The number on the bell. Refreshes every minute and when the person returns to the tab. A failure shows no number, never an error. */
export function useUnreadCount() {
  return useQuery({ queryKey: [...INBOX_KEY, "count"], queryFn: unreadCount, refetchInterval: 60_000, refetchOnWindowFocus: true, retry: false, meta: { silent: true }, select: (d) => d.count });
}

export function useInbox(opts: { unreadOnly?: boolean; limit?: number } = {}) {
  const link = useLinker();
  return useQuery({
    queryKey: [...INBOX_KEY, "list", opts.unreadOnly ?? false, opts.limit ?? 50],
    queryFn: () => listInbox({ limit: opts.limit ?? 50, unread_only: opts.unreadOnly }),
    select: (d): { items: Item[]; total: number } => ({ items: d.notifications.map((n) => toItem(n, link)), total: d.total }),
  });
}
