import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAction } from "@/platform/ui/actions";
import { Field } from "@/platform/ui/kit";
import { money } from "@/platform/format";
import * as api from "../api";
import { KEY, useShareClasses } from "../hooks";
import { outstanding, validatePayment, type Sub } from "../logic";
import { Pick } from "./Pick";

type DialogProps = { sub: Sub; onClose: () => void };

function Shell({ title, description, onClose, children, footer }: { title: string; description?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">{children}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Record money that has reached the bank account. */
export function RecordPaymentDialog({ sub, onClose }: DialogProps) {
  const owed = outstanding(sub);
  const [amount, setAmount] = useState(String(owed));
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const record = useAction(api.recordPayment, { success: "Payment recorded", refresh: [KEY], onDone: onClose, silent: true });
  const submit = () => {
    const values = { amount: Number(amount), payment_reference: reference };
    const found = validatePayment(values, owed);
    setErrors(found);
    if (!Object.keys(found).length) record.mutate({ subscription_id: sub.id, ...values });
  };
  const fields = { ...errors, ...record.error?.fields };
  return (
    <Shell title="Record payment" description={`${sub.name}: ${money(owed)} still owed`} onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={record.isPending}>Record</Button></>}>
      <Field label="Amount (LSL)" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} error={fields.amount} />
      <Field label="Bank reference" value={reference} onChange={(e) => setReference(e.target.value)} error={fields.payment_reference} />
      {record.error && !Object.keys(record.error.fields).length && <p role="alert" className="text-xs text-destructive">{record.error.message}</p>}
    </Shell>
  );
}

/** Move a board member's shares to another member or to another class. */
export function TransferDialog({ sub, mode, onClose }: DialogProps & { mode: "member" | "class" }) {
  const members = useQuery({ queryKey: ["board-members"], queryFn: api.boardMembers, select: (d) => d.members.filter((m) => m.status === "active"), enabled: mode === "member" });
  const classes = useShareClasses();
  const [target, setTarget] = useState("");
  const [shares, setShares] = useState(String(sub.shares));
  const done = { refresh: [KEY], onDone: onClose };
  const toMember = useAction(api.transferMember, { success: "Shares transferred", ...done });
  const toClass = useAction(api.transferClass, { success: "Shares moved to the new class", ...done });

  const options = mode === "member"
    ? (members.data ?? []).map((m) => ({ value: m.user_id, label: `${m.full_name} (${m.position})` }))
    : (classes.data ?? []).filter((c) => c.name !== sub.shareClass).map((c) => ({ value: c.name, label: c.name }));
  const chosen = target || options[0]?.value || "";
  const n = Number(shares);
  const valid = chosen && Number.isInteger(n) && n > 0 && n <= sub.shares;
  const go = () => (mode === "member"
    ? toMember.mutate({ boardId: sub.boardId!, target_user_id: chosen, num_shares: n })
    : toClass.mutate({ boardId: sub.boardId!, target_share_class: chosen, num_shares: n }));

  return (
    <Shell title={mode === "member" ? "Transfer to another member" : "Move to another class"} description={`${sub.name} holds ${sub.shares} shares`} onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={go} disabled={!valid || toMember.isPending || toClass.isPending}>Transfer</Button></>}>
      <Pick label={mode === "member" ? "Board member" : "Share class"} value={chosen} onChange={setTarget} options={options} />
      <Field label="Number of shares" type="number" min="1" max={sub.shares} value={shares} onChange={(e) => setShares(e.target.value)}
        error={shares && !valid && chosen ? `Enter a whole number from 1 to ${sub.shares}` : undefined} />
    </Shell>
  );
}
