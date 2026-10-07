import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { assignProxy, revokeProxy } from "../api";
import { useProxies } from "../hooks";
import { Select } from "./Select";

/** Hand your vote to someone else, for this session or for all votes, and take it back. Lives inside the vote drawer. */
export default function ProxyPanel({ sessionId }: { sessionId: number }) {
  const q = useProxies();
  const [to, setTo] = useState("");
  const [scope, setScope] = useState<"specific_session" | "all_votes">("specific_session");
  const refresh = [["decisions", "proxies"]];
  const give = useAction(() => assignProxy({ proxy_id: to, scope_type: scope, session_id: scope === "specific_session" ? sessionId : undefined }), { success: "Proxy given", refresh, onDone: () => setTo("") });
  const revoke = useAction((id: number) => revokeProxy(id), { success: "Proxy withdrawn", refresh });

  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">Cannot vote? Give your vote to someone</summary>
      <div className="mt-3 space-y-3">
        <PageState query={q}>
          {(p) => (
            <>
              {p.proxies_given.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {p.proxies_given.map((x) => (
                    <li key={x.id} className="flex items-center justify-between gap-2">
                      <span>{x.proxy_name || x.proxy_email} · {x.scope_type === "all_votes" ? "all votes" : `session ${x.session_id}`}</span>
                      <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(x.id)}>Withdraw</Button>
                    </li>
                  ))}
                </ul>
              )}
              <Select label="Give my vote to" value={to} onChange={setTo} options={[{ value: "", label: "Choose a person…" }, ...p.available_users.map((u) => ({ value: u.id, label: u.name || u.email }))]} />
              <Select label="For" value={scope} onChange={(v) => setScope(v as typeof scope)} options={[{ value: "specific_session", label: "This session only" }, { value: "all_votes", label: "All votes" }]} />
              <Button size="sm" variant="outline" disabled={!to || give.isPending} onClick={() => give.mutate(undefined)}>Give proxy</Button>
            </>
          )}
        </PageState>
      </div>
    </details>
  );
}
