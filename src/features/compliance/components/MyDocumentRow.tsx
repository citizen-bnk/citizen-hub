import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction, useDownload } from "@/platform/ui/actions";
import { Status } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import { type ChecklistItem, downloadDocument, downloadTemplate, resubmitDocument, uploadDocument } from "../api";
import { canUpload, docState, needsResubmit } from "../logic";

const WORDS = { missing: "missing", under_review: "pending review", approved: "approved", rejected: "rejected", expired: "expired" } as const;

export default function MyDocumentRow({ item }: { item: ChecklistItem }) {
  const { requirement: r, submission: s } = item;
  const input = useRef<HTMLInputElement>(null);
  const state = docState(item);
  const refresh = [["compliance"]];
  const upload = useAction(uploadDocument, { success: "Document uploaded", refresh });
  const resubmit = useAction(resubmitDocument, { success: "Document resubmitted", refresh });
  const template = useDownload(downloadTemplate);
  const mine = useDownload(downloadDocument);
  const busy = upload.isPending || resubmit.isPending;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (s && needsResubmit(item)) resubmit.mutate({ documentId: s.id, file });
    else upload.mutate({ requirementId: r.id, file });
    if (input.current) input.current.value = "";
  };

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{r.name}{!item.is_required && <span className="ml-2 text-xs text-muted-foreground">optional</span>}</h3>
          {r.description && <p className="mt-0.5 text-sm text-muted-foreground">{r.description}</p>}
        </div>
        <Status value={WORDS[state]} />
      </div>
      {s && (
        <p className="mt-2 text-sm text-muted-foreground">
          {s.file_name} · sent {date(s.submitted_at)}
          {item.days_until_expiry !== null && state === "approved" ? ` · expires in ${item.days_until_expiry} days` : ""}
        </p>
      )}
      {state === "rejected" && s?.rejection_reason && (
        <p role="note" className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm">Why it was sent back: {s.rejection_reason}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {r.template_file_name && (
          <Button variant="outline" size="sm" onClick={() => template.mutate(r.id)} disabled={template.isPending}>
            <Download className="mr-1 h-4 w-4" aria-hidden /> Template
          </Button>
        )}
        {s?.file_name && (
          <Button variant="outline" size="sm" onClick={() => mine.mutate(s.id)} disabled={mine.isPending}>
            <Download className="mr-1 h-4 w-4" aria-hidden /> My file
          </Button>
        )}
        {canUpload(item) && (
          <>
            <input ref={input} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.docx" aria-label={`File for ${r.name}`} onChange={(e) => onFile(e.target.files?.[0])} />
            <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>
              <Upload className="mr-1 h-4 w-4" aria-hidden /> {busy ? "Uploading…" : state === "missing" ? "Upload" : "Upload again"}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
