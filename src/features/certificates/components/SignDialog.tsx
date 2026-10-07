import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAction } from "@/platform/ui/actions";
import { Field } from "@/platform/ui/kit";
import * as api from "../api";
import { SIGNER_ROLES, validateSign, type Cert } from "../logic";

/** Draw a signature and embed it in the certificate PDF. */
export function SignDialog({ cert, onClose }: { cert: Cert; onClose: () => void }) {
  const pad = useRef<SignatureCanvas>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sign = useAction(api.sign, { success: "Certificate signed", refresh: [["certificates"]], onDone: onClose });

  const submit = () => {
    const image = pad.current && !pad.current.isEmpty() ? pad.current.toDataURL("image/png") : "";
    const values = { signer_name: name, signer_role: role as never, signature_image: image };
    const found = validateSign(values);
    setErrors(found);
    if (!Object.keys(found).length) sign.mutate({ ...values, id: cert.id });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign certificate</DialogTitle>
          <DialogDescription>{cert.number} for {cert.holder}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Signer's name" value={name} onChange={(e) => setName(e.target.value)} error={errors.signer_name} />
          <div className="space-y-1.5">
            <Label htmlFor="signer-role">Role</Label>
            <select id="signer-role" value={role} onChange={(e) => setRole(e.target.value)} aria-invalid={!!errors.signer_role}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm">
              <option value="">Choose a role</option>
              {SIGNER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.signer_role && <p role="alert" className="text-xs text-destructive">{errors.signer_role}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Signature</Label>
            <div className="rounded-md border bg-white">
              <SignatureCanvas ref={pad} penColor="black" canvasProps={{ className: "h-32 w-full", "aria-label": "Signature area" }} />
            </div>
            {errors.signature_image && <p role="alert" className="text-xs text-destructive">{errors.signature_image}</p>}
            <Button type="button" variant="ghost" size="sm" onClick={() => pad.current?.clear()}>Clear</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={sign.isPending}>Sign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
