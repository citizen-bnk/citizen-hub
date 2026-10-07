import { useQuery } from "@tanstack/react-query";
import * as a from "./api";
import { investorOffer, offeredClasses } from "./logic";

export const useSubscriptions = () => useQuery({ queryKey: ["portfolio", "list"], queryFn: a.getSubscriptions, select: (d) => d.subscriptions });
export const useDetail = (id: string) => useQuery({ queryKey: ["portfolio", "detail", id], queryFn: () => a.getDetail(id) });
export const useRequests = () => useQuery({ queryKey: ["portfolio", "requests"], queryFn: a.getRequests, select: (d) => d.requests, meta: { silent: true } });
export const useBank = () => useQuery({ queryKey: ["portfolio", "bank"], queryFn: a.getBank, meta: { silent: true }, retry: false });
export const useCryptos = () => useQuery({ queryKey: ["portfolio", "cryptos"], queryFn: a.getCryptos, select: (d) => d.available_cryptos, meta: { silent: true } });
export const useWallet = (type: string | null) => useQuery({ queryKey: ["portfolio", "wallet", type], queryFn: () => a.getWallet(type!), enabled: !!type, meta: { silent: true } });
export const useAvailability = () => useQuery({ queryKey: ["portfolio", "availability"], queryFn: a.getAvailability, select: investorOffer });
export const useBoardOptions = (enabled: boolean) => useQuery({ queryKey: ["portfolio", "board-options"], queryFn: a.getBoardOptions, enabled, select: (d) => ({ classes: offeredClasses(d.share_classes, true) }), meta: { silent: true } });
export const useMyProfile = () => useQuery({ queryKey: ["portfolio", "profile"], queryFn: a.getProfile, meta: { silent: true } });
