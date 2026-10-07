import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/platform/auth/session";
import { date, label } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { Confirm, DataTable, Drawer, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { newsletters, type Newsletter } from "../web";
import { canPublishNewsletter, newsletterActions } from "../web-logic";
import { NEWSLETTERS_KEY, NewsletterEditor } from "./NewsletterEditor";
import { PublishDialog } from "./PublishDialog";

/** Staff list of every issue: draft or published, who can read it, with create, edit, publish, unpublish and delete. */
export function NewslettersTab() {
  const list = useQuery({ queryKey: NEWSLETTERS_KEY, queryFn: newsletters.list });
  const mayPublish = canPublishNewsletter(useSession().roles);
  const [editing, setEditing] = useState<Newsletter | "new" | null>(null);
  const [publishing, setPublishing] = useState<Newsletter | null>(null);
  const [removing, setRemoving] = useState<Newsletter | null>(null);
  const refresh = [NEWSLETTERS_KEY];
  const publish = useAction(newsletters.publish, { success: "Published", refresh, onDone: () => setPublishing(null) });
  const unpublish = useAction(newsletters.unpublish, { success: "Unpublished", refresh });
  const remove = useAction(newsletters.remove, { success: "Deleted", refresh, onDone: () => setRemoving(null) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Nothing is shown to anyone until you publish it and choose who can read it.</p>
        <Button onClick={() => setEditing("new")}>New newsletter</Button>
      </div>
      <PageState query={list} empty="No newsletters yet.">
        {(rows) => (
          <DataTable
            rows={rows} rowKey={(r) => r.id} onRow={(r) => setEditing(r)}
            columns={[
              { key: "t", header: "Issue", cell: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{[r.issue_no ? `Issue ${r.issue_no}` : "", r.series].filter(Boolean).join(" · ")}</div></div> },
              { key: "d", header: "Date", cell: (r) => date(r.published_on), className: "whitespace-nowrap" },
              { key: "s", header: "Status", cell: (r) => <span className="inline-flex flex-wrap gap-1"><Status value={r.status} /><Badge variant="outline">{label(r.visibility)}</Badge></span> },
              { key: "f", header: "File", cell: (r) => (r.has_file ? "PDF" : r.external_url ? "Link" : "None"), className: "whitespace-nowrap" },
              {
                key: "a", header: "", className: "text-right whitespace-nowrap",
                cell: (r) => (
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="inline-flex gap-1">
                    {mayPublish && newsletterActions(r.status).publish && <Button size="sm" variant="outline" onClick={() => setPublishing(r)}>Publish</Button>}
                    {mayPublish && newsletterActions(r.status).unpublish && <Button size="sm" variant="outline" disabled={unpublish.isPending} onClick={() => unpublish.mutate(r.id)}>Unpublish</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setRemoving(r)}>Delete</Button>
                  </span>
                ),
              },
            ]}
          />
        )}
      </PageState>
      <Drawer open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New newsletter" : "Edit newsletter"}>
        {editing && <NewsletterEditor key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onSaved={(saved, wasNew) => setEditing(wasNew && saved?.id ? saved : null)} />}
      </Drawer>
      {publishing && <PublishDialog title={publishing.title} busy={publish.isPending} onClose={() => setPublishing(null)} onPublish={(visibility) => publish.mutate({ id: publishing.id, visibility })} />}
      <Confirm
        open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} destructive confirmLabel="Delete" busy={remove.isPending}
        title="Delete this newsletter?" description={removing?.title} onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  );
}
