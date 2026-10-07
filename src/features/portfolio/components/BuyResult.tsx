import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, number } from "@/platform/format";
import { Panel } from "@/platform/ui/kit";
import PaymentInstructions from "./PaymentInstructions";
import ProofUpload from "./ProofUpload";

export type Placed = { subscriptionId: string | null; shares: number; total: number; monthly: number | null };

/** What the person sees after submitting: the order, how to pay, and proof upload. */
export default function BuyResult({ placed }: { placed: Placed }) {
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-400" aria-hidden />
          <div>
            <h2 className="font-display text-lg font-semibold">Your order is placed</h2>
            <p className="text-sm text-muted-foreground">
              {number(placed.shares)} shares for {money(placed.total)}.{placed.monthly ? ` About ${money(placed.monthly)} a month.` : ""} Your shares are issued once the payment is confirmed.
            </p>
            {placed.subscriptionId && <p className="mt-1 text-sm">Reference: <strong>{placed.subscriptionId}</strong></p>}
          </div>
        </div>
      </Panel>
      <PaymentInstructions reference={placed.subscriptionId} />
      {placed.subscriptionId
        ? <ProofUpload subscriptionId={placed.subscriptionId} />
        : <p className="text-sm text-muted-foreground">Once you have paid, open the investment in My investments to upload your proof of payment.</p>}
      <div className="flex gap-2">
        <Button asChild><Link to={placed.subscriptionId ? `/portfolio/${placed.subscriptionId}` : "/portfolio"}>{placed.subscriptionId ? "View this investment" : "My investments"}</Link></Button>
      </div>
    </div>
  );
}
