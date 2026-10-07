import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { Field, Panel } from "@/platform/ui/kit";
import { addItems, type Item, replaceItems, type Session } from "../api";
import { canEdit, itemSchema, parseOptions } from "../logic";

/** The questions members vote on (AGM sessions). Added any time before voting ends; removed only while a draft. */
export default function ItemsPanel({ session, items }: { session: Session; items: Item[] }) {
  const [f, setF] = useState({ question: "", description: "", options: "" });
  const [error, setError] = useState<string>();
  const refresh = [["decisions"]];
  const add = useAction(() => addItems(session.id, [{ question: f.question.trim(), description: f.description.trim() || null, options: parseOptions(f.options) }]), {
    success: "Question added", refresh, onDone: () => setF({ question: "", description: "", options: "" }),
  });
  const remove = useAction((id: number) => replaceItems(session.id, items.filter((i) => i.id !== id).map((i) => ({ question: i.question, description: i.description, options: i.options }))), { success: "Question removed", refresh });
  const editable = canEdit(session);

  return (
    <Panel title="Questions">
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No questions yet.</p> : (
        <ol className="divide-y">
          {items.map((i, n) => (
            <li key={i.id} className="flex items-start gap-3 py-2 text-sm">
              <span className="w-6 text-muted-foreground">{n + 1}.</span>
              <div className="flex-1">
                <div className="font-medium">{i.question}</div>
                {i.description && <div className="text-muted-foreground">{i.description}</div>}
                <div className="text-xs text-muted-foreground">Options: {i.options.join(", ")}</div>
              </div>
              {editable && <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(i.id)}>Remove</Button>}
            </li>
          ))}
        </ol>
      )}
      {session.status !== "closed" && session.status !== "finalized" && session.status !== "cancelled" && (
        <form className="mt-4 space-y-3 border-t pt-4" noValidate onSubmit={(e) => {
          e.preventDefault();
          const r = itemSchema.safeParse(f);
          setError(r.success ? undefined : r.error.issues[0].message);
          if (r.success) add.mutate(undefined);
        }}>
          <Field label="New question" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} error={error} />
          <Field label="Options" hint="Separated by commas. Blank means for, against, abstain." value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} />
          <Button type="submit" disabled={add.isPending}>Add question</Button>
        </form>
      )}
    </Panel>
  );
}
