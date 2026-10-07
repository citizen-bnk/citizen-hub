import { useState } from "react";
import { useAction } from "@/platform/ui/actions";
import { Field } from "@/platform/ui/kit";
import { careers, type Advert, type AdvertBody } from "../web";
import { ADVERT_FIELDS, advertBody, linesText } from "../web-logic";
import { ItemForm } from "./ItemForm";

export const CAREERS_KEY = ["comms", "content", "careers"];

/** Create or edit one advert. Responsibilities and requirements are typed one per line. */
export function AdvertEditor({ item, onDone }: { item: Advert | null; onDone: () => void }) {
  const [resp, setResp] = useState(() => linesText(item?.responsibilities));
  const [reqs, setReqs] = useState(() => linesText(item?.requirements));
  const save = useAction(
    (b: AdvertBody) => (item ? careers.update({ id: item.id, ...b }) : careers.create(b)),
    { success: "Saved", refresh: [CAREERS_KEY], onDone },
  );
  return (
    <div className="space-y-4">
      {item?.source_note && <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground"><strong>Note from the import:</strong> {item.source_note}</p>}
      <ItemForm
        fields={ADVERT_FIELDS} item={item as Record<string, unknown> | null} busy={save.isPending}
        extra={(
          <>
            <Field label="Responsibilities, one per line" id="advert-resp" multiline value={resp} onChange={(e) => setResp(e.target.value)} />
            <Field label="Requirements, one per line" id="advert-reqs" multiline value={reqs} onChange={(e) => setReqs(e.target.value)} />
          </>
        )}
        onSubmit={(f) => save.mutate(advertBody(f, resp, reqs))}
      />
    </div>
  );
}
