import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confirm, Panel, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useBankAccounts, useDeleteBank, useDeleteWallet, useWallets } from "../hooks";
import { shortAddress, walletTypesLeft } from "../logic";
import type { BankAccount, Wallet } from "../api";
import BankDialog from "./BankDialog";
import WalletDialog from "./WalletDialog";

/** The company's bank accounts and crypto wallets: what an investor sees when told where to pay. */
export default function PaymentAccountsTab() {
  const banks = useBankAccounts();
  const wallets = useWallets();
  const delBank = useDeleteBank();
  const delWallet = useDeleteWallet();
  const [bank, setBank] = useState<Partial<BankAccount> | null>(null);
  const [wallet, setWallet] = useState<Partial<Wallet> | null>(null);
  const [removeBank, setRemoveBank] = useState<BankAccount | null>(null);
  const [removeWallet, setRemoveWallet] = useState<Wallet | null>(null);
  const used = wallets.data?.wallets.map((w) => w.crypto_type) ?? [];

  return (
    <div className="space-y-6">
      <Panel title="Bank accounts" actions={<Button size="sm" variant="outline" onClick={() => setBank({})}><Plus className="mr-1 h-4 w-4" />Add account</Button>}>
        <PageState query={banks} empty="No bank account yet. Investors cannot be shown where to pay until you add one.">
          {(rows) => (
            <ul className="divide-y">
              {rows.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{b.account_name} <span className="font-normal text-muted-foreground">({b.currency})</span></div>
                    <div className="text-sm text-muted-foreground">{b.bank_name}{b.branch_name ? `, ${b.branch_name}` : ""} · Account {b.account_number} · Branch {b.branch_code}{b.swift_code ? ` · SWIFT ${b.swift_code}` : ""}</div>
                  </div>
                  {b.is_default && <Status value="default" />}
                  <Status value={b.is_active ? "active" : "inactive"} />
                  <Button size="icon" variant="ghost" aria-label={`Edit ${b.account_name}`} onClick={() => setBank(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${b.account_name}`} onClick={() => setRemoveBank(b)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </PageState>
      </Panel>

      <Panel title="Crypto wallets" actions={walletTypesLeft(used).length > 0 && <Button size="sm" variant="outline" onClick={() => setWallet({})}><Plus className="mr-1 h-4 w-4" />Add wallet</Button>}>
        <PageState query={wallets} isEmpty={(w) => w.wallets.length === 0} empty="No crypto wallet yet.">
          {({ wallets: rows }) => (
            <ul className="divide-y">
              {rows.map((w) => (
                <li key={w.crypto_type} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{w.crypto_type}{w.network_info ? <span className="font-normal text-muted-foreground"> on {w.network_info}</span> : null}</div>
                    <div className="break-all font-mono text-xs text-muted-foreground" title={w.wallet_address}>{shortAddress(w.wallet_address)}</div>
                  </div>
                  <Status value={w.is_active ? "active" : "inactive"} />
                  <Button size="icon" variant="ghost" aria-label={`Edit ${w.crypto_type} wallet`} onClick={() => setWallet(w)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${w.crypto_type} wallet`} onClick={() => setRemoveWallet(w)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </PageState>
      </Panel>

      {bank && <BankDialog key={bank.id ?? "new"} account={bank} onClose={() => setBank(null)} />}
      {wallet && <WalletDialog key={wallet.crypto_type ?? "new"} wallet={wallet} used={used} onClose={() => setWallet(null)} />}
      <Confirm
        open={!!removeBank} onOpenChange={(o) => !o && setRemoveBank(null)} destructive busy={delBank.isPending}
        title={`Delete "${removeBank?.account_name}"?`} description="Investors will no longer be shown this account." confirmLabel="Delete"
        onConfirm={() => removeBank && delBank.mutate(removeBank.id, { onSettled: () => setRemoveBank(null) })}
      />
      <Confirm
        open={!!removeWallet} onOpenChange={(o) => !o && setRemoveWallet(null)} destructive busy={delWallet.isPending}
        title={`Delete the ${removeWallet?.crypto_type} wallet?`} description="Investors will no longer be able to pay with it." confirmLabel="Delete"
        onConfirm={() => removeWallet && delWallet.mutate(removeWallet.crypto_type, { onSettled: () => setRemoveWallet(null) })}
      />
    </div>
  );
}
