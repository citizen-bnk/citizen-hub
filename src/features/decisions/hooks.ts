import { useQuery } from "@tanstack/react-query";
import { history, listSessions, myProxies, notifyCandidates, pendingActions, sessionDetails, sessionResults } from "./api";

export const usePending = () => useQuery({ queryKey: ["decisions", "pending"], queryFn: pendingActions });
export const useHistory = () => useQuery({ queryKey: ["decisions", "history"], queryFn: history });
export const useSessions = () => useQuery({ queryKey: ["decisions", "sessions"], queryFn: listSessions });
export const useSession = (id: string | number) => useQuery({ queryKey: ["decisions", "session", String(id)], queryFn: () => sessionDetails(id) });
export const useResults = (id: string | number, enabled = true) => useQuery({ queryKey: ["decisions", "results", String(id)], queryFn: () => sessionResults(id), enabled });
export const useProxies = () => useQuery({ queryKey: ["decisions", "proxies"], queryFn: myProxies });
export const useNotifyCandidates = (id: number, enabled: boolean) => useQuery({ queryKey: ["decisions", "notify", id], queryFn: () => notifyCandidates(id), enabled });
