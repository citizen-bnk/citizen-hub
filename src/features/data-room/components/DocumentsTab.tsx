import { useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confirm, DataTable, Panel, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { date } from "@/platform/format";
import { useAdminDocuments, useCategories, useDeleteCategory, useDeleteDocument } from "../hooks";
import { fileSize } from "../logic";
import type { AdminDoc, Category } from "../api";
import CategoryDialog from "./CategoryDialog";
import UploadDialog from "./UploadDialog";

const count = (docs: AdminDoc[], id: number) => {
  const n = docs.filter((d) => d.category_id === id).length;
  return `${n} ${n === 1 ? "document" : "documents"}`;
};

type Upload = { replacing?: AdminDoc } | null;

export default function DocumentsTab() {
  const cats = useCategories();
  const docs = useAdminDocuments();
  const delCategory = useDeleteCategory();
  const delDocument = useDeleteDocument();
  const [category, setCategory] = useState<Partial<Category> | null>(null);
  const [upload, setUpload] = useState<Upload>(null);
  const [removeCat, setRemoveCat] = useState<Category | null>(null);
  const [removeDoc, setRemoveDoc] = useState<AdminDoc | null>(null);

  return (
    <div className="space-y-6">
      <Panel title="Categories" actions={<Button size="sm" variant="outline" onClick={() => setCategory({})}><Plus className="mr-1 h-4 w-4" />New category</Button>}>
        <PageState query={cats} empty="No categories yet. Add one before uploading documents.">
          {(list) => (
            <ul className="divide-y">
              {list.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{c.category_name}</div>
                    {c.description && <div className="truncate text-xs text-muted-foreground">{c.description}</div>}
                  </div>
                  <span className="text-xs text-muted-foreground">{count(docs.data?.documents ?? [], c.id)}</span>
                  <Button size="icon" variant="ghost" aria-label={`Rename ${c.category_name}`} onClick={() => setCategory(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${c.category_name}`} onClick={() => setRemoveCat(c)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </PageState>
      </Panel>

      <Panel title="Documents" actions={<Button size="sm" onClick={() => setUpload({})}><Upload className="mr-1 h-4 w-4" />Upload</Button>}>
        <PageState query={docs} isEmpty={(d) => d.documents.length === 0} empty="No documents yet.">
          {({ documents }) => (
            <DataTable
              rows={documents}
              rowKey={(d) => d.id}
              columns={[
                { key: "name", header: "Document", cell: (d) => <div><div className="font-medium">{d.document_name}</div><div className="text-xs text-muted-foreground">{d.category_name ?? "No category"}</div></div> },
                { key: "ver", header: "Version", cell: (d) => d.version },
                { key: "size", header: "Size", cell: (d) => fileSize(d.file_size) },
                { key: "up", header: "Uploaded", cell: (d) => date(d.uploaded_at) },
                { key: "lic", header: "Licence", cell: (d) => (d.is_required_for_license ? <Status value="required" /> : "") },
                {
                  key: "act", header: "", className: "text-right",
                  cell: (d) => (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setUpload({ replacing: d })}>Replace</Button>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${d.document_name}`} onClick={() => setRemoveDoc(d)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </PageState>
      </Panel>

      {category && <CategoryDialog key={category.id ?? "new"} category={category} onClose={() => setCategory(null)} />}
      {upload && <UploadDialog key={upload.replacing?.id ?? "new"} replacing={upload.replacing} categories={cats.data ?? []} onClose={() => setUpload(null)} />}
      <Confirm
        open={!!removeCat} onOpenChange={(o) => !o && setRemoveCat(null)} destructive busy={delCategory.isPending}
        title={`Delete "${removeCat?.category_name}"?`} description="Only an empty category can be deleted."
        confirmLabel="Delete" onConfirm={() => removeCat && delCategory.mutate(removeCat.id, { onSettled: () => setRemoveCat(null) })}
      />
      <Confirm
        open={!!removeDoc} onOpenChange={(o) => !o && setRemoveDoc(null)} destructive busy={delDocument.isPending}
        title={`Delete "${removeDoc?.document_name}"?`} description="Investors will no longer see it. Past access records are kept."
        confirmLabel="Delete" onConfirm={() => removeDoc && delDocument.mutate(removeDoc.id, { onSettled: () => setRemoveDoc(null) })}
      />
    </div>
  );
}
