import { cn } from "@/lib/utils";

/** A plain labelled drop-down, styled like the other inputs. */
export function Select({ label, value, onChange, options, error, className }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string; className?: string;
}) {
  const id = `s-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium leading-none">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-card">{o.label}</option>)}
      </select>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
