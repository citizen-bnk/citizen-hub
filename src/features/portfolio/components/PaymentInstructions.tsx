import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/platform/ui/kit";
import { useBank, useCryptos, useWallet } from "../hooks";

const Row = ({ k, v }: { k: string; v?: string | null }) => (v ? <div className="flex justify-between gap-4 py-1 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium break-all">{v}</dd></div> : null);

/** How to pay: the company's bank account, or a crypto wallet. `reference` is what to quote on the payment. */
export default function PaymentInstructions({ reference }: { reference: string | null }) {
  const bank = useBank();
  const cryptos = useCryptos();
  const [crypto, setCrypto] = useState<string | null>(null);
  const wallet = useWallet(crypto);

  return (
    <Panel title="How to pay">
      {reference && <p className="mb-3 text-sm">Use <strong>{reference}</strong> as your payment reference.</p>}
      <h3 className="mb-1 text-sm font-semibold">Bank transfer</h3>
      {bank.data ? (
        <dl className="mb-4 divide-y rounded-lg border px-3">
          <Row k="Account name" v={bank.data.account_name} />
          <Row k="Bank" v={bank.data.bank_name} />
          <Row k="Account number" v={bank.data.account_number} />
          <Row k="Branch code" v={bank.data.branch_code} />
          <Row k="Branch" v={bank.data.branch_name} />
          <Row k="SWIFT" v={bank.data.swift_code} />
          <Row k="Currency" v={bank.data.currency} />
        </dl>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">{bank.isPending ? "Loading bank details…" : "Bank details are not available right now. Please contact the back office."}</p>
      )}
      {!!cryptos.data?.length && (
        <>
          <h3 className="mb-2 text-sm font-semibold">Or pay with crypto</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {cryptos.data.map((c) => (
              <Button key={c.crypto_type} size="sm" variant={crypto === c.crypto_type ? "default" : "outline"} onClick={() => setCrypto(c.crypto_type)}>{c.crypto_type}</Button>
            ))}
          </div>
          {wallet.data && (
            <dl className="divide-y rounded-lg border px-3">
              <Row k="Wallet address" v={wallet.data.wallet_address} />
              <Row k="Network" v={wallet.data.network_info} />
            </dl>
          )}
        </>
      )}
    </Panel>
  );
}
