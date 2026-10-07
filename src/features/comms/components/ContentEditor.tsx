import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { date } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { Confirm, DataTable, Drawer, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import type { ContentItem, ContentKind } from "../content";
import { KEY, useContent } from "../hooks";
import { ItemForm } from "./ItemForm";

/** List, create, edit, publish and delete for one kind of public content. Written once; `kind` says what is different. */
export function ContentEditor({ kind }: { kind: ContentKind }) {
  const list = useContent(kind.key);
  const refresh = [[...KEY.content, kind.key]];
  const [editing, setEditing] = useState<ContentItem | "new" | null>(null);
  const [removing, setRemoving] = useState<ContentItem | null>(null);
  const [publishing, setPublishing] = useState<ContentItem | null>(null);

  const remove = useAction((i: ContentItem) => kind.remove(i.id), { success: "Deleted", refresh, onDone: () => setRemoving(null) });
  const publish = useAction((i: ContentItem) => kind.publish(i.id), { success: "Published", refresh, onDone: () => setPublishing(null) });
  const onPublish = (i: ContentItem) => (kind.publishWarning ? setPublishing(i) : publish.mutate(i));

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setEditing("new")}>New {kind.noun}</Button></div>
      <PageState query={list} empty={`No ${kind.label.toLowerCase()} yet.`}>
        {(rows) => (
          <DataTable
            rows={rows} rowKey={(r) => r.id} onRow={(r) => setEditing(r)}
            columns={[
              { key: "t", header: "Title", cell: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground line-clamp-1">{r.sub}</div></div> },
              { key: "d", header: "Date", cell: (r) => date(r.date), className: "whitespace-nowrap" },
              { key: "s", header: "Status", cell: (r) => <Status value={r.status} /> },
              {
                key: "a", header: "", className: "text-right whitespace-nowrap",
                cell: (r) => (
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="inline-flex gap-1">
                    {!r.published && <Button size="sm" variant="outline" onClick={() => onPublish(r)}>Publish</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setRemoving(r)}>Delete</Button>
                  </span>
                ),
              },
            ]}
          />
        )}
      </PageState>

      <Drawer open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? `New ${kind.noun}` : `Edit ${kind.noun}`}>
        {editing && <EditItem key={editing === "new" ? "new" : editing.id} kind={kind} item={editing === "new" ? null : editing} refresh={refresh} onDone={() => setEditing(null)} />}
      </Drawer>

      <Confirm
        open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} destructive confirmLabel="Delete" busy={remove.isPending}
        title={`Delete this ${kind.noun}?`} description={removing?.title} onConfirm={() => removing && remove.mutate(removing)}
      />
      <Confirm
        open={!!publishing} onOpenChange={(o) => !o && setPublishing(null)} confirmLabel="Publish" busy={publish.isPending}
        title={`Publish "${publishing?.title ?? ""}"?`} description={kind.publishWarning} onConfirm={() => publishing && publish.mutate(publishing)}
      />
    </div>
  );
}

function EditItem({ kind, item, refresh, onDone }: { kind: ContentKind; item: ContentItem | null; refresh: string[][]; onDone: () => void }) {
  // The list may hold only a summary; fetch the full record when editing.
  const full = useQuery({
    queryKey: [...KEY.content, kind.key, "item", item?.id], enabled: !!item && !!kind.detail,
    queryFn: () => (kind.detail as NonNullable<typeof kind.detail>)(item!.id),
  });
  const save = useAction(
    (body: Record<string, unknown>) => (item ? kind.update(item.id, body) : kind.create(body)),
    { success: "Saved", refresh, onDone },
  );

  if (item && kind.detail && full.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <ItemForm
      fields={kind.fields} item={item ? (full.data ?? item.raw) : null} busy={save.isPending}
      extra={item && kind.uploadImage ? <ImageUpload kind={kind} id={item.id} current={String(item.raw.image_url ?? "")} refresh={refresh} /> : null}
      onSubmit={(b) => save.mutate(b)}
    />
  );
}

function ImageUpload({ kind, id, current, refresh }: { kind: ContentKind; id: number; current: string; refresh: string[][] }) {
  const input = useRef<HTMLInputElement>(null);
  const [has, setHas] = useState(!!current);
  const upload = useAction((file: File) => (kind.uploadImage as NonNullable<typeof kind.uploadImage>)(id, file), { success: "Image uploaded", refresh, onDone: () => setHas(true) });
  return (
    <div className="space-y-1.5">
      <label htmlFor="achievement-image" className="text-sm font-medium">Image</label>
      <input
        id="achievement-image" ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={upload.isPending}
        className="block w-full text-sm" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }}
      />
      <p className="text-xs text-muted-foreground">{has ? "An image is set; choose a file to replace it." : "JPEG, PNG or WebP, up to 5 MB."}</p>
    </div>
  );
}
