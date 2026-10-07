import { useQuery } from "@tanstack/react-query";
import { fromBoard, fromCore, fromMine, type Sub } from "./logic";
import * as api from "./api";

export const KEY = ["subscriptions"] as const;

/** The list for a "type": everything, board members' only, or the ones I created. Each comes from its own backend list. */
export function useSubscriptions(type: "all" | "board" | "mine") {
  return useQuery({
    queryKey: [...KEY, "list", type],
    queryFn: async (): Promise<Sub[]> => {
      if (type === "board") return (await api.listBoard()).subscriptions.map(fromBoard);
      if (type === "mine") return (await api.listMine()).subscriptions.map(fromMine);
      return (await api.listAll()).subscriptions.map(fromCore);
    },
  });
}

export const useShareClasses = () => useQuery({ queryKey: ["share-classes"], queryFn: api.shareClasses, select: (d) => d.classes, staleTime: 300_000 });
