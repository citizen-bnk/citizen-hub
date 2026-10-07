import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/platform/ui/kit";
import { useAction } from "@/platform/ui/actions";
import { uploadProof } from "../api";

/** Send the bank or crypto receipt so the back office can confirm the payment. */
export default function ProofUpload({ subscriptionId, status }: { subscriptionId: string; status?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useAction(uploadProof, { success: "Proof of payment sent. We will confirm it shortly.", refresh: [["portfolio"]] });
  return (
    <Panel title="Proof of payment">
      <p className="mb-3 text-sm text-muted-foreground">
        {status === "proof_submitted" ? "Your proof is with us and waiting to be confirmed. You can send another file if needed." : "Paid already? Upload the receipt (PDF or image) so we can confirm it."}
      </p>
      <input ref={input} type="file" accept="application/pdf,image/*" className="sr-only" aria-label="Proof of payment file"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) upload.mutate({ id: subscriptionId, file }); e.target.value = ""; }} />
      <Button variant="outline" disabled={upload.isPending} onClick={() => input.current?.click()}><Upload className="mr-2 h-4 w-4" />{upload.isPending ? "Sending…" : "Choose file"}</Button>
    </Panel>
  );
}
