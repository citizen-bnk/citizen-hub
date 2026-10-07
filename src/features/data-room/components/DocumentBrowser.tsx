import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/platform/ui/kit";
import { PageState } from "@/platform/ui/PageState";
import { useInvestorDocuments } from "../hooks";
import { fileSize, groupByCategory, matches } from "../logic";
import type { InvestorDoc } from "../api";
import ReasonDialog from "./ReasonDialog";

/** Search, filter by category and open documents. Opening asks for a reason, which the office can see. */
export default function DocumentBrowser() {
  const docs = useInvestorDocuments(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [opening, setOpening] = useState<InvestorDoc | null>(null);
  const categories = useMemo(() => groupByCategory(docs.data ?? []).map((g) => g.name), [docs.data]);

  return (
    <PageState query={docs} empty="No documents have been added to the data room yet.">
      {(all) => {
        const groups = groupByCategory(all.filter((d) => matches(d, search, category)));
        return (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <Input aria-label="Search documents" placeholder="Search documents" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select aria-label="Category" className="h-10 rounded-md border bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {groups.length === 0 && <p className="text-sm text-muted-foreground">No document matches.</p>}
            <div className="space-y-4">
              {groups.map((g) => (
                <Panel key={g.name} title={g.name}>
                  <ul className="divide-y">
                    {g.docs.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 py-2.5">
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{d.document_name}</div>
                          <div className="text-xs text-muted-foreground">
                            Version {d.version} · {fileSize(d.file_size)}{d.is_required_for_license ? " · Required for the licence" : ""}
                            {d.description ? ` · ${d.description}` : ""}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setOpening(d)}>Open</Button>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
            <ReasonDialog doc={opening} onClose={() => setOpening(null)} />
          </>
        );
      }}
    </PageState>
  );
}
