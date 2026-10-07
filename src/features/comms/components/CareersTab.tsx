import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSession } from "@/platform/auth/session";
import { date } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { Confirm, DataTable, Drawer, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { careers, type Advert } from "../web";
import { WORDING_CONFIRMATION, advertActions, canPublishAdvert } from "../web-logic";
import { AdvertEditor, CAREERS_KEY } from "./AdvertEditor";

/** Job adverts. Only the super admin can publish one, after confirming its wording does not misstate the licence position. */
export function CareersTab() {
  const list = useQuery({ queryKey: CAREERS_KEY, queryFn: careers.list });
  const mayPublish = canPublishAdvert(useSession().roles);
  const [editing, setEditing] = useState<Advert | "new" | null>(null);
  const [publishing, setPublishing] = useState<Advert | null>(null);
  const [removing, setRemoving] = useState<Advert | null>(null);
  const refresh = [CAREERS_KEY];
  const publish = useAction(careers.publish, { success: "Published", refresh, onDone: () => setPublishing(null) });
  const close = useAction(careers.close, { success: "Closed", refresh });
  const remove = useAction(careers.remove, { success: "Deleted", refresh, onDone: () => setRemoving(null) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Citizen Bank is an applicant for a banking licence. An advert must not describe it as an existing licensed bank. Only the super admin can publish an advert.
        </p>
        <Button onClick={() => setEditing("new")}>New advert</Button>
      </div>
      <PageState query={list} empty="No adverts yet.">
        {(rows) => (
          <DataTable
            rows={rows} rowKey={(r) => r.id} onRow={(r) => setEditing(r)}
            columns={[
              { key: "t", header: "Role", cell: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{[r.department, r.employment_type, r.location].filter(Boolean).join(" · ")}</div></div> },
              { key: "c", header: "Closes", cell: (r) => date(r.closing_date), className: "whitespace-nowrap" },
              { key: "s", header: "Status", cell: (r) => <Status value={r.status} /> },
              {
                key: "a", header: "", className: "text-right whitespace-nowrap",
                cell: (r) => (
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="inline-flex gap-1">
                    {mayPublish && advertActions(r.status).publish && <Button size="sm" variant="outline" onClick={() => setPublishing(r)}>Publish</Button>}
                    {advertActions(r.status).close && <Button size="sm" variant="outline" disabled={close.isPending} onClick={() => close.mutate(r.id)}>Close</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setRemoving(r)}>Delete</Button>
                  </span>
                ),
              },
            ]}
          />
        )}
      </PageState>
      <Drawer open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New advert" : "Edit advert"}>
        {editing && <AdvertEditor key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
      <Confirm
        open={!!publishing} onOpenChange={(o) => !o && setPublishing(null)} confirmLabel="Confirm and publish" busy={publish.isPending}
        title={`Publish "${publishing?.title ?? ""}"?`}
        description={<>It will appear on the public careers page. {WORDING_CONFIRMATION}</>}
        onConfirm={() => publishing && publish.mutate(publishing.id)}
      />
      <Confirm
        open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} destructive confirmLabel="Delete" busy={remove.isPending}
        title="Delete this advert?" description={removing?.title} onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  );
}
