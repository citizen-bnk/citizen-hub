import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAction, useDownload } from "@/platform/ui/actions";
import { Confirm } from "@/platform/ui/kit";
import * as api from "../api";
import { allowedActions, validateReason, type Cert, type CertAction } from "../logic";
import { SignDialog } from "./SignDialog";

const LABELS: Record<CertAction, string> = {
  sign: "Sign", download: "Download PDF", resend: "Resend email", regenerate: "Regenerate PDF", revoke: "Revoke", reactivate: "Reactivate",
};

/** The actions a certificate's status allows, in one menu. */
export function RowActions({ cert }: { cert: Cert }) {
  const [open, setOpen] = useState<null | "sign" | "revoke" | "reactivate">(null);
  const [reason, setReason] = useState("");
  const refresh = { refresh: [["certificates"]] };
  const revoke = useAction(api.revoke, { success: "Certificate revoked", ...refresh, onDone: () => { setOpen(null); setReason(""); } });
  const reactivate = useAction(api.reactivate, { success: "Certificate reactivated", ...refresh, onDone: () => setOpen(null) });
  const resend = useAction(api.resendEmail, { success: "Email queued" });
  const regenerate = useAction(api.regenerate, { success: "PDF regenerated" });
  const download = useDownload(api.downloadPdf);

  const run: Record<CertAction, () => void> = {
    sign: () => setOpen("sign"),
    download: () => download.mutate(cert.number),
    resend: () => resend.mutate(cert.id),
    regenerate: () => regenerate.mutate(cert.id),
    revoke: () => setOpen("revoke"),
    reactivate: () => setOpen("reactivate"),
  };
  const problem = reason ? validateReason(reason) : undefined;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${cert.number}`}><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allowedActions(cert).map((a) => <DropdownMenuItem key={a} onSelect={run[a]}>{LABELS[a]}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>

      {open === "sign" && <SignDialog cert={cert} onClose={() => setOpen(null)} />}
      <Confirm open={open === "revoke"} onOpenChange={(o) => !o && setOpen(null)} title={`Revoke ${cert.number}?`} destructive confirmLabel="Revoke" busy={revoke.isPending}
        description={<><span className="mb-2 block">The holder's certificate stops being valid. You can reactivate it later.</span>
          <Input aria-label="Reason" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!!problem} />
          {problem && <span role="alert" className="mt-1 block text-xs text-destructive">{problem}</span>}</>}
        onConfirm={() => { if (!validateReason(reason)) revoke.mutate({ id: cert.id, reason: reason.trim() }); }} />
      <Confirm open={open === "reactivate"} onOpenChange={(o) => !o && setOpen(null)} title={`Reactivate ${cert.number}?`} confirmLabel="Reactivate" busy={reactivate.isPending}
        description="The certificate becomes valid again." onConfirm={() => reactivate.mutate(cert.id)} />
    </>
  );
}
