import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction, useDownload } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Confirm, DataTable, Field, PageHeader, Panel, PrimaryButton, Status } from "@/platform/ui/kit";
import { date } from "@/platform/format";
import * as api from "../api";
import { validateTemplate } from "../logic";

const KEY = ["certificates", "templates"];

export default function Templates() {
  const list = useQuery({ queryKey: KEY, queryFn: api.listTemplates });
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<api.Template | null>(null);
  const upload = useAction(api.uploadTemplate, { success: "Template uploaded", refresh: [KEY], silent: true, onDone: () => { setName(""); setFile(null); } });
  const activate = useAction(api.activateTemplate, { success: "Template activated", refresh: [KEY] });
  const remove = useAction(api.deleteTemplate, { success: "Template deleted", refresh: [KEY], onDone: () => setRemoving(null) });
  const download = useDownload(api.downloadTemplate);

  const submit = () => {
    const found = validateTemplate(name, file);
    setErrors(found);
    if (!Object.keys(found).length) upload.mutate({ file: file!, template_name: name.trim() });
  };
  const shown = { ...errors, ...upload.error?.fields };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Certificate templates" description="The fillable PDF that new certificates are made from. One template is active at a time." />
      <Panel title="Upload a template">
        <form className="grid gap-3 sm:grid-cols-3 sm:items-start" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} error={shown.template_name} />
          <div className="space-y-1.5">
            <Label htmlFor="tpl-file">PDF file</Label>
            <Input id="tpl-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-invalid={!!shown.file} />
            {shown.file && <p role="alert" className="text-xs text-destructive">{shown.file}</p>}
          </div>
          <PrimaryButton type="submit" className="sm:mt-6" disabled={upload.isPending}>Upload</PrimaryButton>
        </form>
        {upload.error && !Object.keys(upload.error.fields).length && <p role="alert" className="mt-2 text-sm text-destructive">{upload.error.message}</p>}
      </Panel>

      <PageState query={list} empty="No templates yet. Upload the first one above.">
        {(rows) => (
          <DataTable rows={rows} rowKey={(r) => r.id} columns={[
            { key: "name", header: "Template", cell: (r) => <><div className="font-medium">{r.template_name}</div>{r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}</> },
            { key: "version", header: "Version", cell: (r) => `v${r.version}`, className: "hidden sm:table-cell" },
            { key: "created", header: "Uploaded", cell: (r) => date(r.created_at), className: "hidden sm:table-cell" },
            { key: "status", header: "Status", cell: (r) => <Status value={r.is_active ? "active" : "inactive"} /> },
            { key: "actions", header: "", cell: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => download.mutate(r.id)}>Download</Button>
                {!r.is_active && <Button size="sm" variant="outline" onClick={() => activate.mutate(r.id)} disabled={activate.isPending}>Activate</Button>}
                {!r.is_active && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setRemoving(r)}>Delete</Button>}
              </div>
            ) },
          ]} />
        )}
      </PageState>

      <Confirm open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} title={`Delete ${removing?.template_name}?`} destructive confirmLabel="Delete"
        description="The PDF is removed for good." busy={remove.isPending} onConfirm={() => removing && remove.mutate(removing.id)} />
    </div>
  );
}
