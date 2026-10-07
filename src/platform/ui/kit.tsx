import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { label } from "../format";

/** The shared building blocks of every Hub screen. Features compose these instead of writing their own. */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label: l, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{l}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  good: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  bad: "bg-red-500/15 text-red-300 border-red-500/30",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  muted: "bg-muted text-muted-foreground",
};
const STATUS_TONE: [RegExp, keyof typeof TONES][] = [
  [/^(paid|approved|active|completed|issued|signed|open|sent|accepted|compliant|verified|available)/, "good"],
  [/^(pending|partial|draft|scheduled|awaiting|submitted|in_review|review|invited|queued)/, "warn"],
  [/^(rejected|failed|cancel|revoked|expired|overdue|suspended|declined|missing|inactive|closed)/, "bad"],
];

/** A status word as a coloured badge: "paid" green, "pending" amber, "rejected" red; anything else neutral. */
export function Status({ value }: { value: string | null | undefined }) {
  const v = (value ?? "").toLowerCase();
  const tone = STATUS_TONE.find(([re]) => re.test(v))?.[1] ?? "muted";
  return <Badge variant="outline" className={cn("whitespace-nowrap", TONES[tone])}>{label(value)}</Badge>;
}

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; className?: string };

/** A plain responsive table. Rows are clickable when `onRow` is given. */
export function DataTable<T>({ rows, columns, rowKey, onRow }: { rows: readonly T[]; columns: Column<T>[]; rowKey: (row: T) => string | number; onRow?: (row: T) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={cn("px-3 py-2 font-medium", c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn("border-t", onRow && "cursor-pointer hover:bg-accent/50")}
              onClick={onRow ? () => onRow(row) : undefined}
              tabIndex={onRow ? 0 : undefined}
              onKeyDown={onRow ? (e) => e.key === "Enter" && onRow(row) : undefined}
            >
              {columns.map((c) => <td key={c.key} className={cn("px-3 py-2 align-middle", c.className)}>{c.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A labelled input. Pass `error` (from ApiError.fields or your own check) to show the message beside the field. */
export function Field({ label: l, error, hint, multiline, ...props }: {
  label: string; error?: string; hint?: string; multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>) {
  const id = props.id ?? `f-${l.replace(/\W+/g, "-").toLowerCase()}`;
  const common = { id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{l}</Label>
      {multiline ? <Textarea {...common} {...(props as object)} /> : <Input {...common} {...props} />}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** "Are you sure?" for actions that cannot be undone. */
export function Confirm({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, busy, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: ReactNode;
  confirmLabel?: string; destructive?: boolean; busy?: boolean; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); onConfirm(); }} className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}>
            {busy ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** A side panel for the detail of a row, so a list never needs a second page. */
export function Drawer({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4 space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export const PrimaryButton = (props: React.ComponentProps<typeof Button>) => <Button {...props} className={cn("text-white", props.className)} style={{ backgroundImage: "var(--grad)", ...props.style }} />;
