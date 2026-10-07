import { useQuery } from "@tanstack/react-query";
import { useAction } from "@/platform/ui/actions";
import * as q from "./api";

const KEY = "settings";
export const useShareClasses = () => useQuery({ queryKey: [KEY, "share-classes"], queryFn: q.shareClasses });
export const useBankAccounts = () => useQuery({ queryKey: [KEY, "banks"], queryFn: q.bankAccounts });
export const useWallets = () => useQuery({ queryKey: [KEY, "wallets"], queryFn: q.wallets });

const refresh = [[KEY]];
export const useSaveShareClass = () => useAction(q.updateShareClass, { success: "Share class saved", refresh });
export const useSaveBank = () =>
  useAction((v: { id?: number; body: q.BankBody }) => (v.id ? q.updateBank({ id: v.id, body: v.body }) : q.createBank(v.body)), { success: "Bank account saved", refresh });
export const useDeleteBank = () => useAction(q.deleteBank, { success: "Bank account deleted", refresh });
export const useSaveWallet = () => useAction(q.saveWallet, { success: "Wallet saved", refresh });
export const useDeleteWallet = () => useAction(q.deleteWallet, { success: "Wallet deleted", refresh });
