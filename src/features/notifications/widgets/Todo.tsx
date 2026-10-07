import { X } from "lucide-react";
import { Panel } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { INBOX_KEY, markRead } from "@/platform/notifications";
import { ItemRow } from "../components/ItemRow";
import { useTodo } from "../hooks";

export default function Todo() {
  const todo = useTodo();
  const dismiss = useAction((id: number) => markRead([id]), { refresh: [[...INBOX_KEY]] });
  const query = { data: todo.items, isPending: !todo.ready, isError: !!todo.error, error: todo.error, refetch: todo.refetch, isFetching: false };
  return (
    <Panel title="To do">
      <PageState query={query} empty="You are all caught up.">
        {(items) => (
          <ul className="-mx-3 divide-y">
            {items.map((i) => (
              <ItemRow key={i.id} title={i.title} body={i.body} link={i.link}
                action={i.notificationId !== undefined && <button type="button" aria-label={`Dismiss ${i.title}`} disabled={dismiss.isPending} onClick={() => dismiss.mutate(i.notificationId!)} className="rounded p-1 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>} />
            ))}
          </ul>
        )}
      </PageState>
    </Panel>
  );
}
