import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, Field, PrimaryButton, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { money, number } from "@/platform/format";
import { useSaveShareClass, useShareClasses } from "../hooks";
import { shareClassChanges, shareClassErrors, soldPercent, toForm, type ShareClassForm } from "../logic";
import type { ShareClass } from "../api";

export default function ShareClassesTab() {
  const classes = useShareClasses();
  const [editing, setEditing] = useState<ShareClass | null>(null);
  return (
    <>
      <PageState query={classes} empty="No share classes are set up.">
        {(rows) => (
          <DataTable
            rows={rows}
            rowKey={(c) => c.id}
            columns={[
              { key: "c", header: "Class", cell: (c) => <div><div className="font-medium">{c.display_name}</div><div className="max-w-xs truncate text-xs text-muted-foreground">{c.description}</div></div> },
              { key: "p", header: "Price per share", cell: (c) => money(c.price_per_share, c.currency) },
              { key: "l", header: "Per subscription", cell: (c) => `${number(c.min_shares)} to ${number(c.max_shares)}` },
              { key: "o", header: "On offer", cell: (c) => number(c.shares_on_offer) },
              { key: "s", header: "Issued", cell: (c) => `${number(c.shares_issued)} (${soldPercent(c)}%)` },
              { key: "a", header: "Available", cell: (c) => number(c.available_shares) },
              { key: "st", header: "Status", cell: (c) => <Status value={c.is_active ? "active" : "inactive"} /> },
              { key: "e", header: "", className: "text-right", cell: (c) => <Button size="icon" variant="ghost" aria-label={`Edit ${c.display_name}`} onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button> },
            ]}
          />
        )}
      </PageState>
      {editing && <EditClass key={editing.id} current={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditClass({ current, onClose }: { current: ShareClass; onClose: () => void }) {
  const save = useSaveShareClass();
  const [form, setForm] = useState<ShareClassForm>(toForm(current));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof ShareClassForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const found = shareClassErrors(form, current.shares_issued);
    setErrors(found);
    if (Object.keys(found).length) return;
    const changes = shareClassChanges(current, form);
    if (Object.keys(changes).length === 0) return onClose();
    save.mutate({ className: current.class_name, changes }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current.display_name}</DialogTitle>
          <DialogDescription>New subscriptions use these terms straight away. Shares already issued are not affected.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Price per share (${current.currency})`} inputMode="decimal" value={form.price_per_share} onChange={set("price_per_share")} error={errors.price_per_share} />
          <Field label="Shares on offer" inputMode="numeric" value={form.shares_on_offer} onChange={set("shares_on_offer")} error={errors.shares_on_offer} hint={`${number(current.shares_issued)} already issued`} />
          <Field label="Minimum per subscription" inputMode="numeric" value={form.min_shares} onChange={set("min_shares")} error={errors.min_shares} />
          <Field label="Maximum per subscription" inputMode="numeric" value={form.max_shares} onChange={set("max_shares")} error={errors.max_shares} />
          <div className="sm:col-span-2"><Field label="Description" value={form.description} onChange={set("description")} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={submit} disabled={save.isPending}>Save</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
