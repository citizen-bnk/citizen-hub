import { Label } from "@/components/ui/label";
import { Field } from "@/platform/ui/kit";
import { cn } from "@/lib/utils";
import type { FieldSpec } from "../sections";

/** One field of a section as an input, a choice list, or (when it cannot be changed here) its fixed value and the reason. */
export function FieldInput({ f, value, onChange, error, unlock }: {
  f: FieldSpec; value: string; onChange: (v: string) => void; error?: string; unlock?: boolean;
}) {
  const wrap = (node: React.ReactNode) => <div className={cn(f.wide && "sm:col-span-2")}>{node}</div>;
  if (f.fixed && !unlock) return wrap(<Field label={f.label} value={value} readOnly hint={f.fixed} />);
  if (f.kind === "select") {
    const id = `sel-${f.name}`;
    return wrap(
      <div className="space-y-1.5">
        <Label htmlFor={id}>{f.label}</Label>
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          {f.options?.map(([val, text]) => <option key={val} value={val} className="bg-card">{text}</option>)}
        </select>
      </div>,
    );
  }
  const type = f.name === "email" ? "email" : f.kind === "text" ? undefined : f.kind;
  return wrap(<Field label={f.label} type={type} value={value} onChange={(e) => onChange(e.target.value)} error={error} hint={f.hint} />);
}
