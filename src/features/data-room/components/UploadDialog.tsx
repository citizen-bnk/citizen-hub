import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Field, PrimaryButton } from "@/platform/ui/kit";
import { useUpload } from "../hooks";
import { fieldErrors, nextVersion, uploadSchema } from "../logic";
import type { AdminDoc, Category } from "../api";

/** Upload a document, or (with `replacing`) upload its new version and retire the old one. Mount with `key`. */
export default function UploadDialog({ replacing, categories, onClose }: { replacing?: AdminDoc; categories: Category[]; onClose: () => void }) {
  const upload = useUpload();
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ document_name: replacing?.document_name ?? "", version: replacing ? nextVersion(replacing.version) : "1.0", description: replacing?.description ?? "" });
  const [categoryId, setCategoryId] = useState(String(replacing?.category_id ?? ""));
  const [required, setRequired] = useState(replacing?.is_required_for_license ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const r = uploadSchema.safeParse(form);
    const errs = fieldErrors(r);
    if (!file) errs.file = "Choose a file";
    setErrors(errs);
    if (!r.success || !file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("document_name", r.data.document_name);
    body.append("version", r.data.version);
    body.append("is_required_for_license", String(required));
    if (categoryId) body.append("category_id", categoryId);
    if (form.description.trim()) body.append("description", form.description.trim());
    upload.mutate({ form: body, replaceId: replacing?.id }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{replacing ? "Replace document" : "Upload document"}</DialogTitle>
          {replacing && <DialogDescription>The new file is stored first, then the old version is removed from the data room.</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          <Field label="File" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} error={errors.file} />
          <Field label="Document name" value={form.document_name} onChange={set("document_name")} error={errors.document_name} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Version" value={form.version} onChange={set("version")} error={errors.version} />
            <div className="space-y-1.5">
              <Label htmlFor="up-category">Category</Label>
              <select id="up-category" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
            </div>
          </div>
          <Field label="Description" value={form.description} onChange={set("description")} />
          <div className="flex items-center gap-2">
            <Checkbox id="up-required" checked={required} onCheckedChange={(v) => setRequired(v === true)} />
            <Label htmlFor="up-required">Required for the banking licence</Label>
          </div>
          {upload.error && <p role="alert" className="text-sm text-destructive">{upload.error.message}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={submit} disabled={upload.isPending}>{upload.isPending ? "Uploading…" : replacing ? "Replace" : "Upload"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
