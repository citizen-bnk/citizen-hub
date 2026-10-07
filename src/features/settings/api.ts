import { api } from "@/platform/api/http";

export type ShareClass = {
  id: number; class_name: string; display_name: string; description: string; price_per_share: number; currency: string;
  min_shares: number; max_shares: number; shares_on_offer: number; shares_issued: number; available_shares: number;
  is_default: boolean; is_active: boolean; created_at: string; updated_at: string;
};
export type ShareClassChanges = Partial<Pick<ShareClass, "price_per_share" | "min_shares" | "max_shares" | "shares_on_offer" | "description">>;

export type BankAccount = {
  id: number; account_name: string; bank_name: string; account_number: string; branch_code: string; branch_name: string | null;
  swift_code: string | null; currency: string; is_active: boolean; is_default: boolean; description: string | null;
};
export type BankBody = Omit<BankAccount, "id">;

export type Wallet = { id: string | number | null; crypto_type: string; wallet_address: string; network_info: string | null; is_active: boolean; created_at: string | null; updated_at: string | null };
export type WalletBody = { crypto_type: string; wallet_address: string; network_info: string | null; is_active: boolean };

export const shareClasses = () => api.get<ShareClass[]>("/share-classes/admin");
export const updateShareClass = (v: { className: string; changes: ShareClassChanges }) => api.put<ShareClass>(`/share-classes/${encodeURIComponent(v.className)}`, v.changes);

export const bankAccounts = () => api.get<BankAccount[]>("/bank-accounts/list-bank-accounts");
export const createBank = (b: BankBody) => api.post<BankAccount>("/bank-accounts/create-bank-account", b);
export const updateBank = (v: { id: number; body: BankBody }) => api.put<BankAccount>(`/bank-accounts/update-bank-account/${v.id}`, v.body);
export const deleteBank = (id: number) => api.delete(`/bank-accounts/delete-bank-account/${id}`);

export const wallets = () => api.get<{ wallets: Wallet[] }>("/back-office/crypto-wallets");
/** The backend creates or updates the wallet of that type. */
export const saveWallet = (b: WalletBody) => api.post("/back-office/crypto-wallets", b);
export const deleteWallet = (cryptoType: string) => api.delete(`/back-office/crypto-wallets/${cryptoType}`);
