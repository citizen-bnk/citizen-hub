import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageState } from "@/platform/ui/PageState";
import { useAction } from "@/platform/ui/actions";
import { Drawer, Field } from "@/platform/ui/kit";
import { label } from "@/platform/format";
import { castVote, type Item, type Proxy } from "../api";
import { useProxies, useSession } from "../hooks";
import { optionsFor, proxyApplies } from "../logic";
import ProxyPanel from "./ProxyPanel";
import { Select } from "./Select";

/** Vote on one session: a choice per question, a note, and (when it applies) voting for someone who gave you their proxy. */
export default function VoteDrawer({ sessionId, title, onClose }: { sessionId: number; title: string; onClose: () => void }) {
  const q = useSession(sessionId);
  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={title} description="Your vote is final once you send it.">
      <PageState query={q}>{(d) => <Ballot sessionId={sessionId} items={d.items} onDone={onClose} />}</PageState>
      <ProxyPanel sessionId={sessionId} />
    </Drawer>
  );
}

function Ballot({ sessionId, items, onDone }: { sessionId: number; items: Item[]; onDone: () => void }) {
  // A resolution has no items: one vote with item_id null.
  const questions: (Item | null)[] = items.length ? items : [null];
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [comments, setComments] = useState("");
  const [asProxy, setAsProxy] = useState("");
  const proxies = useProxies();
  const held: Proxy[] = (proxies.data?.proxies_received ?? []).filter((p) => proxyApplies(p, sessionId));
  const key = (i: Item | null) => String(i?.id ?? 0);
  const complete = questions.every((i) => choice[key(i)]);

  const send = useAction(
    async () => {
      for (const i of questions) await castVote({ session_id: sessionId, item_id: i?.id ?? null, vote_value: choice[key(i)], comments: comments.trim() || undefined, voting_as_proxy_for: asProxy || undefined });
    },
    { success: "Your vote is recorded", refresh: [["decisions"]], onDone },
  );

  return (
    <div className="space-y-4">
      {held.length > 0 && (
        <Select label="Voting as" value={asProxy} onChange={setAsProxy}
          options={[{ value: "", label: "Myself" }, ...held.map((p) => ({ value: p.assignor_id, label: `${p.assignor_name || p.assignor_email} (their proxy)` }))]} />
      )}
      {questions.map((i) => (
        <fieldset key={key(i)} className="space-y-2">
          <legend className="text-sm font-medium">{i?.question ?? "Do you approve this resolution?"}</legend>
          {i?.description && <p className="text-xs text-muted-foreground">{i.description}</p>}
          <div className="flex flex-wrap gap-2">
            {optionsFor(i).map((o) => (
              <Label key={o} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${choice[key(i)] === o ? "border-primary bg-accent" : "hover:bg-accent/50"}`}>
                <input type="radio" className="sr-only" name={`item-${key(i)}`} value={o} checked={choice[key(i)] === o} onChange={() => setChoice((c) => ({ ...c, [key(i)]: o }))} />
                {label(o)}
              </Label>
            ))}
          </div>
        </fieldset>
      ))}
      <Field label="Comment (optional)" multiline value={comments} onChange={(e) => setComments(e.target.value)} />
      <Button disabled={!complete || send.isPending} onClick={() => send.mutate(undefined)}>{send.isPending ? "Sending…" : "Send my vote"}</Button>
    </div>
  );
}
