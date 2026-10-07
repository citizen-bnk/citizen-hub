import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { Field, Panel, Status } from "@/platform/ui/kit";
import { date, label } from "@/platform/format";
import { addDocument, deleteDocument, type Doc, type Session } from "../api";
import { DOC_TYPES, documentSchema } from "../logic";
import { Select } from "./Select";

/** Documents attached to the session. The backend stores a link to the file, so a document is added by its address. */
export default function DocsPanel({ session, docs }: { session: Session; docs: Doc[] }) {
  const empty = { document_type: "supporting_doc", file_name: "", file_url: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refresh = [["decisions"]];
  const add = useAction(() => addDocument({ session_id: session.id, document_type: f.document_type, file_name: f.file_name.trim(), file_url: f.file_url.trim() }), {
    success: "Document added", refresh, onDone: () => setF(empty),
  });
  const remove = useAction((id: number) => deleteDocument(id), { success: "Document removed", refresh });

  return (
    <Panel title="Documents">
      {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents attached.</p> : (
        <ul className="divide-y">
          {docs.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <a href={x.file_url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">{x.file_name}</a>
                <div className="text-xs text-muted-foreground">{label(x.document_type)} · {date(x.uploaded_at)}</div>
              </div>
              {x.status && <Status value={x.status} />}
              <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(x.id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
      <form className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2" noValidate onSubmit={(e) => {
        e.preventDefault();
        const r = documentSchema.safeParse(f);
        const errs: Record<string, string> = {};
        if (!r.success) for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
        setErrors(errs);
        if (r.success) add.mutate(undefined);
      }}>
        <Select label="Kind of document" value={f.document_type} onChange={(v) => setF({ ...f, document_type: v })} options={DOC_TYPES.map((t) => ({ value: t, label: label(t) }))} />
        <Field label="Name" value={f.file_name} onChange={(e) => setF({ ...f, file_name: e.target.value })} error={errors.file_name} />
        <div className="sm:col-span-2"><Field label="Link to the file" placeholder="https://" value={f.file_url} onChange={(e) => setF({ ...f, file_url: e.target.value })} error={errors.file_url} hint={f.document_type === "minutes" ? "Every active board member is asked to approve minutes." : undefined} /></div>
        <div><Button type="submit" disabled={add.isPending}>Add document</Button></div>
      </form>
    </Panel>
  );
}
