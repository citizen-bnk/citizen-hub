import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, PrimaryButton } from "@/platform/ui/kit";
import { useSaveCategory } from "../hooks";
import { categorySchema, fieldErrors } from "../logic";
import type { Category } from "../api";

/** Create (category = {}) or rename/edit a category. Mount with `key` so the form starts fresh each time. */
export default function CategoryDialog({ category, onClose }: { category: Partial<Category>; onClose: () => void }) {
  const save = useSaveCategory();
  const [form, setForm] = useState({
    category_name: category.category_name ?? "", description: category.description ?? "", display_order: String(category.display_order ?? 0),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const r = categorySchema.safeParse(form);
    setErrors(fieldErrors(r));
    if (r.success) save.mutate({ id: category.id, category_name: r.data.category_name, description: r.data.description || null, display_order: Number(r.data.display_order) }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{category.id ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name" value={form.category_name} onChange={set("category_name")} error={errors.category_name} />
          <Field label="Description" value={form.description} onChange={set("description")} />
          <Field label="Order in the list" inputMode="numeric" value={form.display_order} onChange={set("display_order")} error={errors.display_order} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={submit} disabled={save.isPending}>Save</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
