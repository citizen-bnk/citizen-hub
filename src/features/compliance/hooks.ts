import { useQuery } from "@tanstack/react-query";
import { getChecklist, getMembers, getReadiness, getRequirements, getReviewQueue, getSettings } from "./api";

export const useChecklist = () => useQuery({ queryKey: ["compliance", "checklist"], queryFn: getChecklist });
export const useReviewQueue = () => useQuery({ queryKey: ["compliance", "review-queue"], queryFn: getReviewQueue });
export const useMembers = () => useQuery({ queryKey: ["compliance", "members"], queryFn: getMembers });
export const useReadiness = () => useQuery({ queryKey: ["compliance", "readiness"], queryFn: getReadiness });
export const useRequirements = () => useQuery({ queryKey: ["compliance", "requirements"], queryFn: getRequirements });
export const useSettings = () => useQuery({ queryKey: ["compliance", "settings"], queryFn: getSettings });
