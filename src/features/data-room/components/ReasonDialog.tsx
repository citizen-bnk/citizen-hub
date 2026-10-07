import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, PrimaryButton } from "@/platform/ui/kit";
import { useOpenDocument } from "../hooks";
import { reasonSchema } from "../logic";
import type { InvestorDoc } from "../api";

export default function ReasonDialog({ doc, onClose }: { doc: InvestorDoc | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const open = useOpenDocument();

  const submit = () => {
    const r = reasonSchema.safeParse(reason);
    setError(r.success ? undefined : r.error.issues[0].message);
    if (r.success && doc) open.mutate({ id: doc.id, reason: r.data }, { onSuccess: () => { setReason(""); onClose(); } });
  };

  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{doc?.document_name}</DialogTitle>
          <DialogDescription>The office is told when a document is opened and sees your reason.</DialogDescription>
        </DialogHeader>
        <Field label="Why are you opening this document?" value={reason} onChange={(e) => setReason(e.target.value)} error={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={submit} disabled={open.isPending}>{open.isPending ? "Opening…" : "Open document"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
