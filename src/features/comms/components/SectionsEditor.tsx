import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/platform/ui/kit";
import type { SectionDraft } from "../web-logic";

/** Headings with their points (one per line): what the issue covers. Add, edit and remove sections. */
export function SectionsEditor({ drafts, onChange }: { drafts: SectionDraft[]; onChange: (d: SectionDraft[]) => void }) {
  const set = (i: number, patch: Partial<SectionDraft>) => onChange(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Sections</legend>
      {drafts.map((d, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <Field label={`Heading ${i + 1}`} id={`sec-h-${i}`} value={d.heading} onChange={(e) => set(i, { heading: e.target.value })} />
          <Field label="Points, one per line" id={`sec-p-${i}`} multiline value={d.points} onChange={(e) => set(i, { points: e.target.value })} />
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(drafts.filter((_, j) => j !== i))}><Trash2 className="mr-1 h-4 w-4" aria-hidden />Remove section</Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...drafts, { heading: "", points: "" }])}><Plus className="mr-1 h-4 w-4" aria-hidden />Add a section</Button>
    </fieldset>
  );
}
