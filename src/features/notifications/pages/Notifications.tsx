import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { PageHeader, Panel } from "@/platform/ui/kit";
import { INBOX_KEY, markAllRead, markRead, useInbox } from "@/platform/notifications";
import { ItemRow } from "../components/ItemRow";
import Settings from "../components/Settings";

function Inbox() {
  const q = useInbox();
  const read = useAction((id: number) => markRead([id]), { refresh: [[...INBOX_KEY]] });
  const readAll = useAction(markAllRead, { success: "All marked as read", refresh: [[...INBOX_KEY]] });
  return (
    <PageState query={q} empty="Nothing here yet. Updates about your investments, meetings and requests will appear here." isEmpty={(d) => d.items.length === 0}>
      {({ items }) => (
        <Panel
          actions={items.some((i) => i.unread) && <Button size="sm" variant="outline" disabled={readAll.isPending} onClick={() => readAll.mutate(undefined)}>Mark all as read</Button>}
        >
          <ul className="-mx-3 divide-y">
            {items.map((i) => (
              <ItemRow key={i.id} title={i.title} body={i.body} at={i.at} unread={i.unread} link={i.link}
                action={i.unread && <Button size="sm" variant="ghost" disabled={read.isPending} onClick={() => read.mutate(i.id)}>Mark read</Button>} />
            ))}
          </ul>
        </Panel>
      )}
    </PageState>
  );
}

export default function Notifications() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" description="What needs your attention, and how we reach you." />
      <Tabs defaultValue="inbox">
        <TabsList className="mb-4"><TabsTrigger value="inbox">Inbox</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
        <TabsContent value="inbox"><Inbox /></TabsContent>
        <TabsContent value="settings"><Settings /></TabsContent>
      </Tabs>
    </div>
  );
}
