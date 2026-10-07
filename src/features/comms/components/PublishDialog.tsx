import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Visibility } from "../web";
import { VISIBILITIES, whoSees } from "../web-logic";

/** Publishing an issue means choosing who can read it; the dialog says exactly who will see it before the button is pressed. */
export function PublishDialog({ title, busy, onClose, onPublish }: { title: string; busy: boolean; onClose: () => void; onPublish: (v: Visibility) => void }) {
  const [visibility, setVisibility] = useState<Visibility>("members");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish "{title}"</DialogTitle>
          <DialogDescription>Choose who can read this issue.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as Visibility)} className="gap-2" aria-label="Who can read it">
          {VISIBILITIES.map((v) => (
            <Label key={v.value} htmlFor={`vis-${v.value}`} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal">
              <RadioGroupItem id={`vis-${v.value}`} value={v.value} /> {v.label}
            </Label>
          ))}
        </RadioGroup>
        <p role="status" className="rounded-lg bg-muted p-3 text-sm">{whoSees(visibility)}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => onPublish(visibility)} disabled={busy}>{busy ? "Publishing…" : `Publish as ${visibility}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
