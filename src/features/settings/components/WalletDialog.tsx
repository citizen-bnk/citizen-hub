import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Field, PrimaryButton } from "@/platform/ui/kit";
import { useSaveWallet } from "../hooks";
import { walletAddressError, walletTypesLeft } from "../logic";
import type { Wallet } from "../api";

/** Add (wallet = {}) or edit the wallet of one coin; there is one wallet per coin. Mount with `key`. */
export default function WalletDialog({ wallet, used, onClose }: { wallet: Partial<Wallet>; used: readonly string[]; onClose: () => void }) {
  const save = useSaveWallet();
  const editing = !!wallet.crypto_type;
  const choices = editing ? [wallet.crypto_type!] : walletTypesLeft(used);
  const [type, setType] = useState(choices[0] ?? "BTC");
  const [address, setAddress] = useState(wallet.wallet_address ?? "");
  const [network, setNetwork] = useState(wallet.network_info ?? "");
  const [active, setActive] = useState(wallet.is_active ?? true);
  const [error, setError] = useState<string>();

  const submit = () => {
    const e = walletAddressError(type, address);
    setError(e);
    if (!e) save.mutate({ crypto_type: type, wallet_address: address.trim(), network_info: network.trim() || null, is_active: active }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? `Edit ${type} wallet` : "Add crypto wallet"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wallet-type">Coin</Label>
            <select id="wallet-type" disabled={editing} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {choices.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Wallet address" value={address} onChange={(e) => setAddress(e.target.value)} error={error} className="font-mono" />
          <Field label="Network" value={network} onChange={(e) => setNetwork(e.target.value)} hint="For example Bitcoin mainnet, Ethereum, or Tron (TRC-20)" />
          <div className="flex items-center gap-2"><Checkbox id="wallet-active" checked={active} onCheckedChange={(v) => setActive(v === true)} /><Label htmlFor="wallet-active">Investors can pay to this wallet</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={submit} disabled={save.isPending}>Save</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
