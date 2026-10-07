import { useQuery } from "@tanstack/react-query";
import { getAvailableUsers, getDashboard, getHistory, getMembers, getPositions, getUnmapped } from "./api";

export const useMembers = () => useQuery({ queryKey: ["roster", "members"], queryFn: getMembers });
export const usePositions = () => useQuery({ queryKey: ["roster", "positions"], queryFn: getPositions });
export const useHistory = (memberId?: number, enabled = true) => useQuery({ queryKey: ["roster", "history", memberId ?? "all"], queryFn: () => getHistory(memberId), enabled });
export const useUnmapped = () => useQuery({ queryKey: ["roster", "unmapped"], queryFn: getUnmapped });
export const useAvailableUsers = (enabled: boolean) => useQuery({ queryKey: ["roster", "available-users"], queryFn: getAvailableUsers, enabled });
export const useDashboard = () => useQuery({ queryKey: ["roster", "dashboard"], queryFn: getDashboard });
