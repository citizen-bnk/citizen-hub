import { useState } from "react";
import { PrimaryButton } from "@/platform/ui/kit";
import { useAction } from "@/platform/ui/actions";
import { PROFILE_KEY, registerProfile, saveProfile, type Profile } from "@/platform/profile";
import { fromProfile, toPayload, validateProfile, type FormValues } from "../logic";
import { sectionById, type FieldKey } from "../sections";
import { FieldInput } from "./FieldInput";

const STEPS = [sectionById("identity"), sectionById("contact"), sectionById("address")];

/** First-time setup: the three sections a person must fill in (who, contact, address) as one short form. It registers the profile, or completes an existing one. */
export default function SetupForm({ profile, email, onSaved }: { profile: Profile | null; email: string; onSaved?: () => void }) {
  const register = !profile;
  const [edits, setEdits] = useState<Partial<FormValues>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const v: FormValues = { ...fromProfile(profile, email), ...edits };

  const save = useAction(
    (values: FormValues) => (register ? registerProfile(toPayload(values, { register: true })) : saveProfile(toPayload(values, { version: profile.version }))),
    { success: register ? "Profile created" : "Profile saved", silent: true, refresh: [[...PROFILE_KEY]], onDone: () => { setEdits({}); onSaved?.(); } },
  );
  const problems: Record<string, string> = { ...save.error?.fields, ...errors };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateProfile(v, { register, requireAddress: true });
    setErrors(found);
    if (!Object.keys(found).length) save.mutate(v);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {STEPS.map((s) => (
        <section key={s.id} className="rounded-2xl border bg-card p-4 sm:p-5" aria-label={s.title}>
          <h3 className="mb-3 font-display text-base font-semibold">{s.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.fields.map((f) => (
              <FieldInput key={f.name} f={f} value={v[f.name as FieldKey]} error={problems[f.name]} unlock={register} onChange={(val) => setEdits((p) => ({ ...p, [f.name]: val }))} />
            ))}
          </div>
        </section>
      ))}
      <div className="flex justify-end"><PrimaryButton type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : register ? "Create profile" : "Save"}</PrimaryButton></div>
    </form>
  );
}
