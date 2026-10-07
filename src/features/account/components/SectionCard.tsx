import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/platform/ui/kit";
import { useAction } from "@/platform/ui/actions";
import { PROFILE_KEY, saveProfile, type Profile } from "@/platform/profile";
import { fromProfile, validateProfile, type FormValues } from "../logic";
import { editable, rowsOf, sectionPayload, type FieldKey, type SectionSpec } from "../sections";
import { FieldInput } from "./FieldInput";
import VerifyContact from "./VerifyContact";

/**
 * One section of the profile. It is read-only until the person chooses Edit; then only this section's fields appear, with
 * Save and Cancel. Nothing else on the page changes.
 */
export default function SectionCard({ section, profile, editing, onEdit, onClose }: {
  section: SectionSpec; profile: Profile; editing: boolean; onEdit: () => void; onClose: () => void;
}) {
  const [edits, setEdits] = useState<Partial<FormValues>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const v: FormValues = { ...fromProfile(profile, profile.email), ...edits };

  const save = useAction((values: FormValues) => saveProfile(sectionPayload(section, values, profile.version)), {
    success: "Saved", silent: true, refresh: [[...PROFILE_KEY]], onDone: () => { setEdits({}); onClose(); },
  });
  const problems: Record<string, string> = { ...save.error?.fields, ...errors };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mine = new Set<string>(editable(section).map((f) => f.name));
    const found = Object.fromEntries(Object.entries(validateProfile(v)).filter(([k]) => mine.has(k)));
    setErrors(found);
    if (!Object.keys(found).length) save.mutate(v);
  };
  const cancel = () => { setEdits({}); setErrors({}); save.reset(); onClose(); };

  const rows = rowsOf(section, profile);
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label={section.title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div><h3 className="font-display text-base font-semibold">{section.title}</h3><p className="text-xs text-muted-foreground">{section.blurb}</p></div>
        {!editing && editable(section).length > 0 && (
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${section.title}`}><Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />{rows.length ? "Edit" : "Add"}</Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {section.fields.map((f) => (
              <FieldInput key={f.name} f={f} value={v[f.name as FieldKey]} error={problems[f.name]} onChange={(val) => setEdits((p) => ({ ...p, [f.name]: val }))} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={cancel} disabled={save.isPending}>Cancel</Button>
            <PrimaryButton type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</PrimaryButton>
          </div>
        </form>
      ) : section.id === "contact" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <VerifyContact type="email" value={profile.email} verified={!!profile.email_verified} />
          <VerifyContact type="mobile" value={profile.phone} verified={!!profile.mobile_verified} />
        </div>
      ) : rows.length ? (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(({ f, value }) => (
            <div key={f.name} className={f.wide ? "sm:col-span-2" : undefined}><dt className="text-xs text-muted-foreground">{f.label}</dt><dd className="break-words text-sm font-medium">{value}</dd></div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing added yet.</p>
      )}
    </section>
  );
}
