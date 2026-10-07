import { Check, Circle } from "lucide-react";
import { Status } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import { accessSummary, type AgreementRow } from "../logic";

/** The three agreements and where each stands, in one line of chips. */
export default function AgreementStrip({ rows, hasAccess }: { rows: AgreementRow[]; hasAccess: boolean }) {
  const summary = accessSummary(rows, hasAccess);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3 text-sm" data-testid="agreement-strip">
      <span className="font-medium">{summary.text}</span>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-1.5">
            {r.signed ? <Check className="h-4 w-4 text-emerald-400" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
            <span>{r.short}{r.signed ? ` signed ${date(r.signedAt)}` : " not signed"}</span>
            {r.review && <Status value={r.review} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
