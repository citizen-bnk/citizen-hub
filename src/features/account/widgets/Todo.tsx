import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Panel } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { markRead } from "../api";
import { useTodo } from "../hooks";

export default function Todo() {
  const q = useTodo();
  const dismiss = useAction(markRead, { refresh: [["account", "todo"]] });
  return (
    <Panel title="To do">
      <PageState query={q} empty="You are all caught up.">
        {(items) => (
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0 text-sm">
                  {i.href ? <Link to={i.href} className="font-medium text-primary-light hover:underline">{i.title}</Link> : <span className="font-medium">{i.title}</span>}
                  {i.body && <p className="truncate text-xs text-muted-foreground">{i.body}</p>}
                </div>
                {i.notificationId !== undefined && (
                  <button type="button" aria-label={`Dismiss ${i.title}`} disabled={dismiss.isPending} onClick={() => dismiss.mutate(i.notificationId!)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
                )}
              </li>
            ))}
          </ul>
        )}
      </PageState>
    </Panel>
  );
}
