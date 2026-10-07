import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/platform/auth/session";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Field, PageHeader, Panel, PrimaryButton } from "@/platform/ui/kit";
import { money } from "@/platform/format";
import * as api from "../api";
import { KEY, useShareClasses } from "../hooks";
import { orderTotal, PAYMENT_METHODS, validateNew, type NewSubscription as Values } from "../logic";
import { Pick } from "../components/Pick";

const empty = { full_name: "", email: "", id_number: "", phone: "", share_class: "", num_shares: "", payment_method: "bank_transfer", admin_notes: "" };

export default function NewSubscription() {
  const nav = useNavigate();
  const { roles } = useSession();
  const classes = useShareClasses();
  const [v, setV] = useState(empty);
  const [proof, setProof] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lookup, setLookup] = useState("");
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  // Looking someone up needs the user directory, which only a super admin may read; everyone else types the details.
  const canLookup = roles.includes("super_admin");
  const found = useQuery({ queryKey: ["user-search", lookup], queryFn: () => api.findUsers(lookup), enabled: canLookup && lookup.length >= 3, select: (d) => d.users.slice(0, 5) });

  // The proof can only be attached to a subscription that exists, so it follows the create. A failed upload is reported once and the
  // subscription is still there; the person can add the proof from its drawer.
  const upload = useAction(api.uploadProof, { success: "Proof of payment attached" });
  const create = useAction(api.createOnBehalf, {
    success: "Subscription created", refresh: [KEY], silent: true,
    onDone: (r) => { if (proof) upload.mutate({ id: r.subscription_id, file: proof }); nav("/office/subscriptions"); },
  });

  const cls = classes.data?.find((c) => c.name === (v.share_class || classes.data?.[0]?.name));
  const values = { ...v, share_class: cls?.name ?? v.share_class, num_shares: v.num_shares === "" ? undefined : Number(v.num_shares) } as Partial<Values>;
  const shown = { ...errors, ...create.error?.fields };
  const submit = () => {
    const problems = validateNew(values, cls);
    setErrors(problems);
    if (!Object.keys(problems).length) create.mutate(values as Values);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New subscription" description="Subscribe an investor to shares on their behalf. We invite them to Citizen Bank if they have no account." />
      <PageState query={classes} empty="No share classes are open for subscription.">
        {(d) => (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
            <Panel title="Investor">
              {canLookup && (
                <div className="mb-4 space-y-1.5">
                  <Label htmlFor="lookup">Find an existing investor</Label>
                  <Input id="lookup" placeholder="Type a name or email (3 letters or more)" value={lookup} onChange={(e) => setLookup(e.target.value)} />
                  {found.data?.map((u) => (
                    <button key={u.user_id} type="button" className="block w-full rounded-md border px-3 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => { setV({ ...v, full_name: u.full_name ?? v.full_name, email: u.email, phone: u.phone ?? v.phone }); setLookup(""); }}>
                      {u.full_name ?? u.email} <span className="text-muted-foreground">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" value={v.full_name} onChange={set("full_name")} error={shown.full_name} />
                <Field label="Email" type="email" value={v.email} onChange={set("email")} error={shown.email} hint="An existing account is recognised by its email." />
                <Field label="ID or passport number" value={v.id_number} onChange={set("id_number")} error={shown.id_number} />
                <Field label="Phone" type="tel" value={v.phone} onChange={set("phone")} error={shown.phone} />
              </div>
            </Panel>

            <Panel title="Shares and payment">
              <div className="grid gap-3 sm:grid-cols-2">
                <Pick label="Share class" value={cls?.name ?? ""} onChange={(share_class) => setV({ ...v, share_class })} error={shown.share_class}
                  options={d.map((c) => ({ value: c.name, label: `${c.name} - ${money(c.price_per_share, c.currency)} a share` }))} />
                <Field label="Number of shares" type="number" min="1" value={v.num_shares} onChange={set("num_shares")} error={shown.num_shares}
                  hint={cls ? `${cls.min_shares} to ${cls.max_shares} shares; ${cls.available_shares} left` : undefined} />
                <Pick label="Payment method" value={v.payment_method} onChange={(payment_method) => setV({ ...v, payment_method })} options={PAYMENT_METHODS} />
                <div className="space-y-1.5">
                  <Label>Total</Label>
                  <p className="flex h-9 items-center font-display text-lg font-semibold">{money(orderTotal(Number(v.num_shares), cls), cls?.currency)}</p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="proof">Proof of payment (optional)</Label>
                  <Input id="proof" type="file" accept="image/*,application/pdf" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                </div>
                <div className="sm:col-span-2"><Field label="Internal notes (optional)" multiline value={v.admin_notes} onChange={set("admin_notes")} /></div>
              </div>
            </Panel>

            {create.error && !Object.keys(create.error.fields).length && <p role="alert" className="text-sm text-destructive">{create.error.message}</p>}
            <PrimaryButton type="submit" disabled={create.isPending}>{create.isPending ? "Creating..." : "Create subscription"}</PrimaryButton>
          </form>
        )}
      </PageState>
    </div>
  );
}
