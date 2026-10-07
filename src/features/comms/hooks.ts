import { useQuery } from "@tanstack/react-query";
import { engagement, mail } from "./api";
import { CONTENT_KINDS } from "./content";

/** Every query of this feature lives under ["comms", ...], so one refresh key covers a screen. */
export const KEY = { campaigns: ["comms", "campaigns"], outbox: ["comms", "outbox"], templates: ["comms", "templates"], content: ["comms", "content"] } as const;

export const useStats = () => useQuery({ queryKey: [...KEY.campaigns, "stats"], queryFn: engagement.stats });
export const useConfig = () => useQuery({ queryKey: [...KEY.campaigns, "config"], queryFn: engagement.config });
export const useFeatures = () => useQuery({ queryKey: [...KEY.campaigns, "features"], queryFn: engagement.features });
export const useDrafts = (status: string) => useQuery({ queryKey: [...KEY.campaigns, "drafts", status], queryFn: () => engagement.drafts(status || undefined) });
export const useDraft = (id: number | null) => useQuery({ queryKey: [...KEY.campaigns, "draft", id], queryFn: () => engagement.draft(id as number), enabled: id !== null });

export const useQueue = () => useQuery({ queryKey: [...KEY.outbox, "queue"], queryFn: mail.queue });
export const useSent = (status: string, search: string) => useQuery({ queryKey: [...KEY.outbox, "sent", status, search], queryFn: () => mail.sent({ status, search }) });
export const useTemplates = () => useQuery({ queryKey: KEY.templates, queryFn: mail.templates });

export const useContent = (kind: string) => {
  const k = CONTENT_KINDS.find((c) => c.key === kind) ?? CONTENT_KINDS[0];
  return useQuery({ queryKey: [...KEY.content, k.key], queryFn: k.list });
};
