import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { date } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { Confirm, DataTable, Drawer, Field, Panel } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { engagement, type Feature, type FeatureBody } from "../api";
import { KEY, useFeatures } from "../hooks";
import type { FieldDef } from "../logic";
import { ItemForm } from "./ItemForm";

const FIELDS: FieldDef[] = [
  { name: "name", label: "Name", required: true },
  { name: "description", label: "Short description", type: "textarea", required: true },
  { name: "detailed_explanation", label: "Detailed explanation", type: "textarea", required: true },
  { name: "cta_text", label: "Button text", required: true },
  { name: "cta_url", label: "Button address", type: "url", required: true },
  { name: "category", label: "Category", required: true },
  { name: "feature_image_url", label: "Image address", type: "url" },
];

/** The features the campaign rotates through. Each one becomes the subject of a round of drafts. */
export function FeaturesPanel() {
  const list = useFeatures();
  const refresh = [[...KEY.campaigns, "features"]];
  const [editing, setEditing] = useState<Feature | "new" | null>(null);
  const [removing, setRemoving] = useState<Feature | null>(null);
  const [prompt, setPrompt] = useState("");

  const toggle = useAction(engagement.toggleFeature, { refresh });
  const remove = useAction(engagement.deleteFeature, { success: "Feature deleted", refresh, onDone: () => setRemoving(null) });
  const save = useAction(
    (b: FeatureBody) => (editing && editing !== "new" ? engagement.updateFeature({ ...b, id: editing.id }) : engagement.createFeature(b)),
    { success: "Feature saved", refresh, onDone: () => setEditing(null) },
  );
  const generate = useAction(engagement.generateFeature, { success: "Feature written and saved", refresh, onDone: () => setPrompt("") });

  return (
    <Panel title="Features to highlight" actions={<Button size="sm" onClick={() => setEditing("new")}>New feature</Button>}>
      <form
        className="mb-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => { e.preventDefault(); if (prompt.trim()) generate.mutate({ prompt: prompt.trim() }); }}
      >
        <div className="min-w-60 flex-1">
          <Field label="Write one with AI" placeholder="Describe the feature, e.g. voting on board decisions from your phone" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={generate.isPending || !prompt.trim()}>{generate.isPending ? "Writing…" : "Generate"}</Button>
      </form>
      <PageState query={list} empty="No features yet. Write one above or add it by hand.">
        {(rows) => (
          <DataTable
            rows={rows} rowKey={(r) => r.id} onRow={(r) => setEditing(r)}
            columns={[
              { key: "n", header: "Feature", cell: (r) => <div><div className="font-medium">{r.name}</div><div className="line-clamp-1 text-xs text-muted-foreground">{r.description}</div></div> },
              { key: "c", header: "Category", cell: (r) => r.category },
              { key: "s", header: "Sent", cell: (r) => `${r.times_sent}×`, className: "whitespace-nowrap" },
              { key: "l", header: "Last sent", cell: (r) => date(r.last_sent_at), className: "whitespace-nowrap" },
              {
                key: "a", header: "In rotation",
                cell: (r) => (
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="inline-flex items-center gap-2">
                    <Switch checked={r.is_active} aria-label={`${r.name} in rotation`} disabled={toggle.isPending} onCheckedChange={() => toggle.mutate(r.id)} />
                    <Button size="sm" variant="ghost" onClick={() => setRemoving(r)}>Delete</Button>
                  </span>
                ),
              },
            ]}
          />
        )}
      </PageState>
      <Drawer open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New feature" : "Edit feature"}>
        {editing && <ItemForm key={editing === "new" ? "new" : editing.id} fields={FIELDS} item={editing === "new" ? null : { ...editing }} busy={save.isPending} onSubmit={(b) => save.mutate(b as unknown as FeatureBody)} />}
      </Drawer>
      <Confirm
        open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} destructive confirmLabel="Delete" busy={remove.isPending}
        title="Delete this feature?" description={removing?.name} onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </Panel>
  );
}
