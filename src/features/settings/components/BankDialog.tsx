import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Field, PrimaryButton } from "@/platform/ui/kit";
import { useSaveBank } from "../hooks";
import { bankSchema, emptyBank, fieldErrors, type BankForm } from "../logic";
import type { BankAccount } from "../api";

/** Add (account = {}) or edit a bank account. Mount with `key`. */
export default function BankDialog({ account, onClose }: { account: Partial<BankAccount>; onClose: () => void }) {
  const save = useSaveBank();
  const [form, setForm] = useState<BankForm>({
    account_name: account.account_name ?? emptyBank.account_name, bank_name: account.bank_name ?? "", account_number: account.account_number ?? "",
    branch_code: account.branch_code ?? "", branch_name: account.branch_name ?? "", swift_code: account.swift_code ?? "",
    currency: account.currency ?? emptyBank.currency, description: account.description ?? "",
  });
  const [active, setActive] = useState(account.is_active ?? true);
  const [isDefault, setIsDefault] = useState(account.is_default ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof BankForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const r = bankSchema.safeParse(form);
    setErrors(fieldErrors(r));
    if (!r.success) return;
    const d = r.data as Required<BankForm>;
    save.mutate(
      { id: account.id, body: { ...d, currency: d.currency.toUpperCase(), swift_code: d.swift_code.toUpperCase() || null, branch_name: d.branch_name || null, description: d.description || null, is_active: active, is_default: isDefault } },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{account.id ? "Edit bank account" : "Add bank account"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account name" value={form.account_name} onChange={set("account_name")} error={errors.account_name} />
          <Field label="Bank" value={form.bank_name} onChange={set("bank_name")} error={errors.bank_name} />
          <Field label="Account number" value={form.account_number} onChange={set("account_number")} error={errors.account_number} />
          <Field label="Currency" value={form.currency} onChange={set("currency")} error={errors.currency} />
          <Field label="Branch code" value={form.branch_code} onChange={set("branch_code")} error={errors.branch_code} />
          <Field label="Branch name" value={form.branch_name} onChange={set("branch_name")} />
          <Field label="SWIFT code" value={form.swift_code} onChange={set("swift_code")} error={errors.swift_code} />
          <Field label="Note for investors" value={form.description} onChange={set("description")} />
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><Checkbox id="bank-active" checked={active} onCheckedChange={(v) => setActive(v === true)} /><Label htmlFor="bank-active">Active</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="bank-default" checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} /><Label htmlFor="bank-default">Default for this currency</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <PrimaryButton onClick={submit} disabled={save.isPending}>Save</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
