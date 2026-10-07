import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/http";
import { type PolicyKey, type PolicyValues, type Snapshot } from "./defaults";
import { setCurrentPolicy } from "./current";
import { listLabel, listOptions, resolvePolicy } from "./logic";
import { loadStored, saveStored } from "./storage";

export { DEFAULT_POLICY, type ListItem, type PolicyKey, type PolicyPlan, type PolicyValues, type Snapshot } from "./defaults";
export { policy, currentPolicy } from "./current";
export { listLabel, listOptions, resolvePolicy } from "./logic";

export const POLICY_KEY = ["policy"] as const;

/**
 * The settings the backend owns (wording, currency, plans, option lists). Always returns a complete snapshot: the defaults until
 * /policy answers (or the last good copy from this browser), and again if it fails. It never throws and never blocks rendering.
 */
export function usePolicy(): Snapshot {
  const q = useQuery({
    queryKey: POLICY_KEY,
    queryFn: async () => {
      const raw = await api.get<unknown>("/policy");
      saveStored(raw);
      return raw;
    },
    staleTime: 10 * 60_000,
    gcTime: 24 * 60 * 60_000,
    initialData: loadStored,
    initialDataUpdatedAt: 0, // the stored copy shows at once, and is refreshed
    meta: { silent: true }, // the defaults keep every screen working; nothing to tell the person
  });
  const snapshot = useMemo(() => resolvePolicy(q.data), [q.data]);
  setCurrentPolicy(snapshot);
  return snapshot;
}

/** One policy value. */
export const usePolicyValue = <K extends PolicyKey>(key: K): PolicyValues[K] => usePolicy().policies[key];

/** The payment plans, in order. */
export const usePlans = () => usePolicy().plans;

/** An option list such as "gender", as [code, label] pairs. */
export function useList(name: string): [string, string][] {
  const s = usePolicy();
  return useMemo(() => listOptions(s, name), [s, name]);
}

export const useListLabel = (name: string) => {
  const s = usePolicy();
  return (code: string) => listLabel(s, name, code);
};

export const useBaseCurrency = () => usePolicyValue("app.base_currency");
