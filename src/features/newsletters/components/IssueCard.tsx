import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { date } from "@/platform/format";
import { useAction, useDownload } from "@/platform/ui/actions";
import { Panel } from "@/platform/ui/kit";
import { getFile, type Newsletter } from "../api";
import { accessOf, issueLine, pdfName, sectionsOf } from "../logic";

/** One issue: what it covers (sections open and close), and Read / Download, a link, or "Not available yet". */
export function IssueCard({ n }: { n: Newsletter }) {
  const access = accessOf(n);
  const sections = sectionsOf(n.sections);
  // The PDF needs the person's sign-in, so it is fetched with it and shown from a temporary address in a new tab.
  const read = useAction(() => getFile({ id: n.id }), {
    onDone: ({ blob }) => {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    },
  });
  const save = useDownload(() => getFile({ id: n.id, download: true }).then((f) => ({ ...f, name: f.name === "download" ? pdfName(n) : f.name })));

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{n.title}</h2>
          <p className="text-xs text-muted-foreground">{[issueLine(n), n.published_on ? date(n.published_on) : ""].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {access.kind === "file" && (
            <>
              <Button size="sm" onClick={() => read.mutate(undefined)} disabled={read.isPending}><FileText className="mr-1 h-4 w-4" aria-hidden />{read.isPending ? "Opening…" : "Read"}</Button>
              <Button size="sm" variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending}><Download className="mr-1 h-4 w-4" aria-hidden />Download</Button>
            </>
          )}
          {access.kind === "link" && (
            <Button size="sm" variant="outline" asChild><a href={access.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />Open the issue</a></Button>
          )}
          {access.kind === "none" && <span className="text-sm text-muted-foreground">Not available yet</span>}
        </div>
      </div>
      {n.summary && <p className="mt-3 text-sm">{n.summary}</p>}
      {sections.length > 0 && (
        <details className="mt-3 rounded-lg border bg-background/50 p-3 text-sm">
          <summary className="cursor-pointer font-medium">What is inside ({sections.length})</summary>
          <div className="mt-2 space-y-3">
            {sections.map((s, i) => (
              <div key={i}>
                {s.heading && <h3 className="font-medium">{s.heading}</h3>}
                {s.points.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">{s.points.map((p, j) => <li key={j}>{p}</li>)}</ul>}
              </div>
            ))}
          </div>
        </details>
      )}
    </Panel>
  );
}
