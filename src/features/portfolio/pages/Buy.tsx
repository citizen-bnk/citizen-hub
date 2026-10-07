import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "@/platform/auth/session";
import { money, number } from "@/platform/format";
import { useAction } from "@/platform/ui/actions";
import { PageState } from "@/platform/ui/PageState";
import { Field, PageHeader, Panel, PrimaryButton } from "@/platform/ui/kit";
import { cn } from "@/lib/utils";
import BuyResult, { type Placed } from "../components/BuyResult";
import { boardInvest, subscribe, trackInviteClick } from "../api";
import { useAvailability, useBoardOptions } from "../hooks";
import { missingCore, useProfile } from "@/platform/profile";
import { boardPlan, checkQuantity, monthlyAmount, orderTotal, PLANS, type Offer, type Plan } from "../logic";

const STEPS = ["Shares", "Your details", "Payment"];

/** Buy shares in three steps; the order is placed on the last one and the result screen explains how to pay. */
export default function Buy() {
  const { roles } = useSession();
  const isBoard = roles.includes("board_member");
  const availability = useAvailability();
  const board = useBoardOptions(isBoard);
  const source = isBoard ? board : availability;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Buy shares" description="Choose how many shares you want, confirm who is buying, then pay." />
      <PageState query={source} empty="No shares are on offer right now." isEmpty={(o) => !o || o.classes.length === 0}>
        {(o) => <Wizard offer={o} isBoard={isBoard} />}
      </PageState>
    </div>
  );
}

function Wizard({ offer, isBoard }: { offer: Offer; isBoard: boolean }) {
  const [step, setStep] = useState(0);
  const [cls, setCls] = useState(offer.classes[0].name);
  const [qty, setQty] = useState("");
  const [plan, setPlan] = useState<Plan>("one-time");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<Placed | null>(null);

  const invite = useSearchParams()[0].get("invite");
  const track = useAction(trackInviteClick, { silent: true });
  useEffect(() => { if (invite) track.mutate(invite); }, [invite]); // eslint-disable-line react-hooks/exhaustive-deps

  // The buyer is the person on the profile: their details are read from it, never typed again here.
  const profile = useProfile().data;
  const missing = missingCore(profile);
  const details = { full_name: profile?.full_name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "", id_number: profile?.id_number ?? "" };

  const chosen = offer.classes.find((c) => c.name === cls) ?? offer.classes[0];
  const shares = Number(qty.replace(/[\s,]/g, ""));
  const total = orderTotal(shares, chosen.price_per_share);
  const qtyError = qty ? checkQuantity(shares, { min: chosen.min_shares, max: chosen.max_shares, available: offer.available }) : null;

  const buy = useAction(
    async () => {
      if (isBoard) {
        const r = await boardInvest({ num_shares: shares, share_class: chosen.name, ...boardPlan(plan) });
        return { subscriptionId: r.subscription.subscription_id, shares, total: Number(r.subscription.total_amount) || total };
      }
      const r = await subscribe({ ...details, num_shares: shares, payment_method: plan === "one-time" ? "one-time" : "installment", installment_plan: plan === "one-time" ? undefined : plan, tracking_token: invite ?? undefined });
      return { subscriptionId: r.subscription_id, shares, total: Number(r.total_amount) || total };
    },
    { refresh: [["portfolio"]], onDone: (r) => setPlaced({ ...r, monthly: plan === "one-time" ? null : monthlyAmount(r.total, plan) }) },
  );

  if (placed) return <BuyResult placed={placed} />;

  const next = () => {
    if (step === 0) {
      const msg = checkQuantity(shares, { min: chosen.min_shares, max: chosen.max_shares, available: offer.available });
      return msg ? setErrors({ qty: msg }) : (setErrors({}), setStep(1));
    }
    if (!isBoard && missing.length) return setErrors({ profile: "Complete your profile first." });
    setErrors({});
    setStep(2);
  };

  return (
    <div className="space-y-4">
      <ol className="flex gap-2 text-sm" aria-label="Steps">
        {STEPS.map((s, i) => <li key={s} aria-current={i === step ? "step" : undefined} className={cn("flex-1 rounded-lg border px-3 py-2 text-center", i === step ? "border-primary font-medium" : "text-muted-foreground")}>{i + 1}. {s}</li>)}
      </ol>

      {step === 0 && (
        <Panel title="How many shares?">
          {offer.classes.length > 1 && (
            <RadioGroup value={cls} onValueChange={setCls} className="mb-4 gap-2" aria-label="Share class">
              {offer.classes.map((c) => (
                <Label key={c.name} htmlFor={`cls-${c.name}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal">
                  <RadioGroupItem id={`cls-${c.name}`} value={c.name} className="mt-1" />
                  <span><strong>{c.name}</strong>{c.restricted && " (board members only)"}<br /><span className="text-muted-foreground">{c.description}</span></span>
                </Label>
              ))}
            </RadioGroup>
          )}
          {offer.classes.length === 1 && <p className="mb-3 text-sm text-muted-foreground"><strong>{chosen.name}</strong>: {chosen.description}</p>}
          <Field label="Number of shares" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} error={errors.qty ?? qtyError ?? undefined}
            hint={`${money(chosen.price_per_share)} a share. Between ${number(chosen.min_shares)} and ${number(chosen.max_shares)} shares.`} />
          <p className="mt-4 text-sm">Total: <strong className="font-display text-xl">{money(total)}</strong></p>
        </Panel>
      )}

      {step === 1 && (isBoard ? (
        <Panel title="Your details">
          <p className="text-sm text-muted-foreground">You are buying as a board member{profile ? ` (${profile.full_name}, ${profile.email})` : ""}. The details on your profile are used. Check them under Profile and settings.</p>
        </Panel>
      ) : (
        <Panel title="Who is buying?">
          {profile ? (
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Name</dt><dd>{profile.full_name || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{profile.email || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{profile.phone || "—"}</dd></div>
              <div><dt className="text-muted-foreground">ID or passport number</dt><dd>{profile.id_number || "—"}</dd></div>
            </dl>
          ) : <p className="text-sm text-muted-foreground">We could not find your profile.</p>}
          <p className="mt-3 text-xs text-muted-foreground">Shares are issued to the person on your profile.{" "}
            <Link to={missing.length || !profile ? "/account/setup" : "/account"} className="underline">{missing.length || !profile ? "Complete your profile" : "Edit your profile"}</Link>
          </p>
          {errors.profile && <p role="alert" className="mt-2 text-sm text-destructive">{errors.profile} Missing: {missing.join(", ") || "profile"}.</p>}
        </Panel>
      ))}

      {step === 2 && (
        <Panel title="How will you pay?">
          <RadioGroup value={plan} onValueChange={(v) => setPlan(v as Plan)} className="gap-2" aria-label="Payment plan">
            {PLANS.map((p) => (
              <Label key={p.value} htmlFor={`plan-${p.value}`} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal">
                <RadioGroupItem id={`plan-${p.value}`} value={p.value} />
                <span className="flex-1">{p.label}</span>
                <span className="text-muted-foreground">{money(monthlyAmount(total, p.value))}{p.months > 1 ? " a month" : ""}</span>
              </Label>
            ))}
          </RadioGroup>
          <p className="mt-3 text-sm text-muted-foreground">{number(shares)} {chosen.name} shares, {money(total)} in total. After you confirm, you will see the bank and crypto details and can upload your proof of payment.</p>
        </Panel>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0 || buy.isPending} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 2 ? <PrimaryButton onClick={next}>Continue</PrimaryButton> : <PrimaryButton disabled={buy.isPending} onClick={() => buy.mutate(undefined)}>{buy.isPending ? "Placing order…" : "Confirm order"}</PrimaryButton>}
      </div>
    </div>
  );
}
