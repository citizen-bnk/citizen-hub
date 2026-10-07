import { useState } from "react";
import { PrimaryButton, Field, Panel } from "@/platform/ui/kit";
import { Label } from "@/components/ui/label";
import { useAction } from "@/platform/ui/actions";
import { registerProfile, saveProfile, type Profile } from "../api";
import { fromProfile, toPayload, validateProfile, type Field as Name, type FormValues } from "../logic";

const CHOICES: Record<string, [string, string][]> = {
  account_type: [["personal", "Personal"], ["business", "Business"]],
  gender: [["", "Prefer not to say"], ["male", "Male"], ["female", "Female"], ["other", "Other"]],
  investor_type: [["", "Not specified"], ["individual", "Individual"], ["institutional", "Institution"], ["accredited", "Accredited investor"]],
};

/**
 * The one profile form. `short` is the first-time setup (who you are, contact, address); the full form adds professional and
 * investor details. With no profile yet it registers one, otherwise it updates it.
 */
export default function ProfileEditor({ profile, email, short, onSaved }: { profile: Profile | null; email: string; short?: boolean; onSaved?: () => void }) {
  const register = !profile;
  const [edits, setEdits] = useState<Partial<FormValues>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const v: FormValues = { ...fromProfile(profile, email), ...edits };

  const save = useAction((values: FormValues) => (register ? registerProfile(toPayload(values, { register: true })) : saveProfile(toPayload(values, { version: profile.version }))), {
    success: register ? "Profile created" : "Profile saved", silent: true, refresh: [["account"]], onDone: () => { setEdits({}); onSaved?.(); },
  });
  const problems = { ...save.error?.fields, ...errors };

  const text = (name: Name | "email" | "id_number", label: string, extra: { type?: string; readOnly?: boolean; hint?: string } = {}) => (
    <Field label={label} value={v[name]} error={problems[name]} onChange={(e) => setEdits((p) => ({ ...p, [name]: e.target.value }))} {...extra} />
  );
  const choice = (name: "account_type" | "gender" | "investor_type", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`sel-${name}`}>{label}</Label>
      <select id={`sel-${name}`} value={v[name]} onChange={(e) => setEdits((p) => ({ ...p, [name]: e.target.value }))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
        {CHOICES[name].map(([val, text]) => <option key={val} value={val} className="bg-card">{text}</option>)}
      </select>
    </div>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateProfile(v, { register, requireAddress: short });
    setErrors(found);
    if (!Object.keys(found).length) save.mutate(v);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Panel title="About you">
        <div className="grid gap-3 sm:grid-cols-2">
          {text("full_name", "Full name")}
          {choice("account_type", "Account type")}
          {text("date_of_birth", "Date of birth", { type: "date" })}
          {short ? null : choice("gender", "Gender")}
          {short ? null : text("nationality", "Nationality")}
          {register ? text("id_number", "ID or passport number") : <Field label="ID or passport number" value={profile.id_number ?? ""} readOnly hint="Contact the back office to change this." />}
        </div>
        {v.account_type === "business" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {text("business_name", "Business name")}
            {text("company_registration_number", "Registration number")}
            {text("tax_id", "Tax ID")}
          </div>
        )}
      </Panel>
      <Panel title="Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          {register ? text("email", "Email", { type: "email" }) : <Field label="Email" value={profile.email} readOnly hint="Your sign-in address." />}
          {text("phone", "Mobile number", { type: "tel", hint: "Include the country code, for example +266." })}
        </div>
      </Panel>
      <Panel title="Address">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("street_address", "Street address")}</div>
          {text("city", "City or town")}
          {text("state_province", "District or province")}
          {text("postal_code", "Postal code")}
          {text("country", "Country")}
        </div>
      </Panel>
      {!short && (
        <>
          <Panel title="Work">
            <div className="grid gap-3 sm:grid-cols-2">
              {text("occupation", "Occupation")}
              {text("employer", "Employer")}
              <div className="sm:col-span-2">{text("linkedin_profile", "LinkedIn link", { type: "url", hint: "https://…" })}</div>
            </div>
          </Panel>
          <Panel title="Investor details">
            <div className="grid gap-3 sm:grid-cols-2">
              {choice("investor_type", "Investor type")}
              {text("source_of_funds", "Source of funds")}
              <div className="sm:col-span-2">{text("investment_purpose", "Purpose of investing")}</div>
            </div>
          </Panel>
        </>
      )}
      <div className="flex justify-end"><PrimaryButton type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : register ? "Create profile" : "Save changes"}</PrimaryButton></div>
    </form>
  );
}
