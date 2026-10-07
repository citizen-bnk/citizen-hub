import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/platform/auth/session";
import { useAction, useDownload } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Confirm, Drawer, Status } from "@/platform/ui/kit";
import { dateTime, label, money } from "@/platform/format";
import * as api from "../api";
import { KEY } from "../hooks";
import { allowedActions, outstanding, type ActionKey, type Sub } from "../logic";
import { RecordPaymentDialog, TransferDialog } from "./ActionDialogs";

const LABELS: Record<ActionKey, string> = {
  verify: "Verify payment proof", reject: "Reject proof", record_payment: "Record payment", upload_proof: "Upload proof",
  issue_certificate: "Issue certificate", receipt: "Download receipt", welcome_letter: "Download welcome letter",
  transfer_member: "Transfer to member", transfer_class: "Change class", cancel: "Cancel investment",
};

type Open = null | "record" | "reject" | "cancel" | "member" | "class";

/** The detail of one subscription, with the actions its status allows. */
export function SubscriptionDrawer({ sub, onClose }: { sub: Sub | null; onClose: () => void }) {
  const { roles } = useSession();
  const [open, setOpen] = useState<Open>(null);
  const [reason, setReason] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const history = useQuery({ queryKey: [...KEY, "payments", sub?.id], queryFn: () => api.paymentHistory(sub!.id), enabled: !!sub });
  const refresh = { refresh: [KEY] };
  const verify = useAction(api.verifyProof, { success: "Proof updated", ...refresh });
  const reject = useAction(api.verifyProof, { success: "Proof rejected", ...refresh, onDone: () => setOpen(null) });
  const upload = useAction(api.uploadProof, { success: "Proof uploaded", ...refresh });
  const issue = useAction(api.issueCertificate, { success: "Certificate issued", ...refresh });
  const cancel = useAction(api.cancelBoard, { success: "Investment cancelled", ...refresh, onDone: () => { setOpen(null); onClose(); } });
  const receipt = useDownload(api.receiptPdf);
  const letter = useDownload(api.welcomeLetterPdf);

  const actions = sub ? allowedActions(sub, { superAdmin: roles.includes("super_admin") }) : [];
  const run: Record<ActionKey, () => void> = {
    verify: () => verify.mutate({ id: sub!.id, approved: true }),
    reject: () => setOpen("reject"),
    record_payment: () => setOpen("record"),
    upload_proof: () => file.current?.click(),
    issue_certificate: () => issue.mutate(sub!.id),
    receipt: () => receipt.mutate(sub!.id),
    welcome_letter: () => letter.mutate(sub!.id),
    transfer_member: () => setOpen("member"),
    transfer_class: () => setOpen("class"),
    cancel: () => setOpen("cancel"),
  };

  return (
    <Drawer open={!!sub} onOpenChange={(o) => !o && onClose()} title={sub?.name ?? ""} description={sub?.id}>
      {sub && (
        <>
          <div className="flex flex-wrap gap-2"><Status value={sub.status} /><Status value={sub.paymentStatus} /></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {([
              ["Email", sub.email], ["Shares", `${sub.shares}${sub.shareClass ? ` (${sub.shareClass})` : ""}`],
              ["Total", money(sub.total)], ["Paid", money(sub.paid)], ["Still owed", money(outstanding(sub))],
              ["Method", label(sub.method)], ["Created", dateTime(sub.createdAt)], ["Proof of payment", sub.hasProof ? "Uploaded" : "None"],
            ] as const).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2" aria-label="Actions">
            {actions.map((a) => (
              <Button key={a} size="sm" variant={a === "verify" || a === "record_payment" ? "default" : "outline"} onClick={run[a]}>{LABELS[a]}</Button>
            ))}
            {!actions.length && <p className="text-sm text-muted-foreground">Nothing more to do on this subscription.</p>}
          </div>
          <Input ref={file} type="file" accept="image/*,application/pdf" className="hidden" aria-label="Payment proof file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate({ id: sub.id, file: f }); e.target.value = ""; }} />

          <h3 className="font-display text-sm font-semibold">Payments</h3>
          <PageState query={history} empty="No payments recorded yet.">
            {({ payments }) => (
              <ul className="divide-y rounded-lg border text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span><span className="font-medium">{money(p.amount)}</span> <span className="text-muted-foreground">ref {p.payment_reference}</span></span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">{dateTime(p.payment_date)} <Status value={p.status} /></span>
                  </li>
                ))}
              </ul>
            )}
          </PageState>

          {open === "record" && <RecordPaymentDialog sub={sub} onClose={() => setOpen(null)} />}
          {(open === "member" || open === "class") && <TransferDialog sub={sub} mode={open} onClose={() => setOpen(null)} />}
          <Confirm open={open === "reject"} onOpenChange={(o) => !o && setOpen(null)} title="Reject this proof of payment?" destructive confirmLabel="Reject"
            description={<><span className="mb-2 block">The investor will need to upload a new proof.</span><Input aria-label="Reason" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} /></>}
            busy={reject.isPending} onConfirm={() => reject.mutate({ id: sub.id, approved: false, notes: reason || undefined })} />
          <Confirm open={open === "cancel"} onOpenChange={(o) => !o && setOpen(null)} title="Cancel this board investment?" destructive confirmLabel="Cancel investment"
            description="Paid shares return to the pool. This cannot be undone." busy={cancel.isPending} onConfirm={() => cancel.mutate(sub.boardId!)} />
        </>
      )}
    </Drawer>
  );
}
