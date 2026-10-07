import { Label } from "@/components/ui/label";

/** A plain labelled drop-down. */
export function Pick({ label, value, onChange, options, error }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly { value: string; label: string }[]; error?: string;
}) {
  const id = `pick-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
