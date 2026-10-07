import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field } from "@/platform/ui/kit";
import { initialValues, toBody, validate, type FieldDef, type Values } from "../logic";

/** A form built from field definitions: the one used for features, press releases, achievements and timeline items. */
export function ItemForm({ fields, item, submitLabel = "Save", busy, serverErrors, extra, onSubmit }: {
  fields: readonly FieldDef[];
  item?: Record<string, unknown> | null;
  submitLabel?: string;
  busy?: boolean;
  serverErrors?: Record<string, string>;
  extra?: ReactNode;
  onSubmit: (body: Record<string, string | number | null>) => void;
}) {
  const [values, setValues] = useState<Values>(() => initialValues(fields, item));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (name: string, v: string) => setValues((p) => ({ ...p, [name]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(fields, values);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(toBody(fields, values));
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {fields.map((f) => {
        const error = errors[f.name] ?? serverErrors?.[f.name];
        if (f.type === "select") {
          const id = `f-${f.name}`;
          return (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={id}>{f.label}</Label>
              <select id={id} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {(f.options ?? []).map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
              </select>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            </div>
          );
        }
        return (
          <Field
            key={f.name} label={f.label} id={`f-${f.name}`} value={values[f.name]} error={error} hint={f.hint}
            multiline={f.type === "textarea"} type={f.type === "date" || f.type === "number" ? f.type : "text"}
            onChange={(e) => set(f.name, e.target.value)}
          />
        );
      })}
      {extra}
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
