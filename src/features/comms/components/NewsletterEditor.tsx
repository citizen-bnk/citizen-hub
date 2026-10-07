import { useState } from "react";
import { useAction } from "@/platform/ui/actions";
import { newsletters, type Newsletter, type NewsletterBody } from "../web";
import { NEWSLETTER_FIELDS, fileProblem, newsletterBody, toDrafts, type SectionDraft } from "../web-logic";
import { ItemForm } from "./ItemForm";
import { SectionsEditor } from "./SectionsEditor";

export const NEWSLETTERS_KEY = ["comms", "content", "newsletters"];

/** Create or edit one issue: its details and sections, then (once it exists) its PDF. */
export function NewsletterEditor({ item, onSaved }: { item: Newsletter | null; onSaved: (saved: Newsletter | undefined, wasNew: boolean) => void }) {
  const [drafts, setDrafts] = useState<SectionDraft[]>(() => toDrafts(item?.sections));
  const save = useAction(
    (b: NewsletterBody) => (item ? newsletters.update({ id: item.id, ...b }) : newsletters.create(b)),
    { success: "Saved", refresh: [NEWSLETTERS_KEY], onDone: (saved) => onSaved(saved, !item) },
  );
  return (
    <div className="space-y-6">
      <ItemForm
        fields={NEWSLETTER_FIELDS} item={item as Record<string, unknown> | null} busy={save.isPending}
        extra={<SectionsEditor drafts={drafts} onChange={setDrafts} />}
        onSubmit={(f) => save.mutate(newsletterBody(f, drafts))}
      />
      {item ? <PdfUpload item={item} /> : <p className="text-xs text-muted-foreground">Save the issue first, then upload its PDF here.</p>}
    </div>
  );
}

function PdfUpload({ item }: { item: Newsletter }) {
  const [problem, setProblem] = useState<string | null>(null);
  const upload = useAction(newsletters.upload, { success: "PDF uploaded", refresh: [NEWSLETTERS_KEY] });
  return (
    <div className="space-y-1.5 border-t pt-4">
      <label htmlFor="newsletter-pdf" className="text-sm font-medium">PDF</label>
      <input
        id="newsletter-pdf" type="file" accept="application/pdf,.pdf" disabled={upload.isPending} className="block w-full text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const p = file ? fileProblem(file) : null;
          setProblem(p);
          if (file && !p) upload.mutate({ id: item.id, file });
          e.target.value = "";
        }}
      />
      {problem && <p role="alert" className="text-xs text-destructive">{problem}</p>}
      <p className="text-xs text-muted-foreground">
        {item.has_file ? `A PDF is stored${item.file_name ? ` (${item.file_name})` : ""}; choose a file to replace it. ` : "No PDF yet. "}
        PDFs up to 4 MB can be uploaded; for a bigger file use the external link.
      </p>
    </div>
  );
}
