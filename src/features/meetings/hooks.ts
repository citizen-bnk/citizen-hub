import { useQuery } from "@tanstack/react-query";
import { boardMembers, listMeetings, loadMeeting } from "./api";

export const useMeetings = (status = "all") =>
  useQuery({ queryKey: ["meetings", "list", status], queryFn: () => listMeetings(status === "all" ? undefined : status).then((r) => r.meetings) });

export const useMeeting = (id: string) => useQuery({ queryKey: ["meetings", "one", id], queryFn: () => loadMeeting(id) });

export const useBoardMembers = () => useQuery({ queryKey: ["meetings", "board-members"], queryFn: boardMembers, meta: { silent: true } });
