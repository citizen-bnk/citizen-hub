import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { label } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { DataTable, Drawer, Field, Status } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { mail, type Template } from "../api";
import { KEY, useTemplates } from "../hooks";
import { EmailFrame } from "./EmailFrame";

/** The registry of emails the system can send: when each is used, switch one off, send a test. */
export function TemplatesTab() {
  const list = useTemplates();
  const [open, setOpen] = useState<Template | null>(null);
  const toggle = useAction(mail.toggleTemplate, { success: "Template updated", refresh: [KEY.templates] });
  return (
    <>
      <PageState query={list} empty="No templates in the registry.">
        {(rows) => (
          <DataTable
            rows={rows} rowKey={(r) => r.id} onRow={(r) => setOpen(r)}
            columns={[
              { key: "n", header: "Template", cell: (r) => <div><div className="font-medium">{r.template_name}</div><div className="line-clamp-1 text-xs text-muted-foreground">{r.subject}</div></div> },
              { key: "c", header: "Category", cell: (r) => label(r.category) },
              { key: "t", header: "Type", cell: (r) => label(r.template_type) },
              { key: "u", header: "Used", cell: (r) => `${r.usage_count}×` },
              {
                key: "a", header: "Active",
                cell: (r) => (
                  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <Switch checked={r.is_active} disabled={toggle.isPending} aria-label={`${r.template_name} active`} onCheckedChange={() => toggle.mutate(r.id)} />
                  </span>
                ),
              },
            ]}
          />
        )}
      </PageState>
      <Drawer open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.template_name ?? "Template"} description={open?.subject}>
        {open && <TemplateDetail key={open.id} template={open} />}
      </Drawer>
    </>
  );
}

function TemplateDetail({ template: t }: { template: Template }) {
  const [email, setEmail] = useState("");
  const [html, setHtml] = useState("");
  const preview = useAction(mail.preview, { onDone: (r) => setHtml(r.html) });
  const test = useAction(mail.test, { success: "Test email queued" });
  return (
    <>
      <div className="flex items-center gap-2 text-sm"><Status value={t.is_active ? "active" : "inactive"} /><span className="text-muted-foreground">{label(t.category)} · {label(t.template_type)}</span></div>
      {t.process_flow && <p className="text-sm">{t.process_flow}</p>}
      {t.trigger_points.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Sent when</h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {t.trigger_points.map((p, i) => <li key={i}>{Object.values(p).map(String).join(" · ")}</li>)}
          </ul>
        </div>
      )}
      <Button variant="outline" disabled={preview.isPending} onClick={() => preview.mutate(t.id)}>{preview.isPending ? "Loading…" : "Preview with sample data"}</Button>
      {html && <EmailFrame html={html} title={`${t.template_name} preview`} />}
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); test.mutate({ id: t.id, email: email.trim() }); }}>
        <div className="min-w-48 flex-1"><Field label="Send a test to" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <Button type="submit" disabled={test.isPending || !email.includes("@")}>Send test</Button>
      </form>
    </>
  );
}
