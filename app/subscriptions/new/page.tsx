import { redirect } from "next/navigation";
import { Workspace } from "@/components/Workspace";
import { Hero } from "@/components/BoardView";
import { Recovery } from "@/components/Recovery";
import { SubscribeFlow } from "@/components/SubscribeFlow";
import { canInvest, getOpportunity } from "@/lib/subscription-store";

export const dynamic = "force-dynamic";

export default async function NewSubscription({ searchParams }: { searchParams: Promise<{ opportunity?: string }> }) {
  const { opportunity } = await searchParams;
  if (!opportunity || !/^[0-9a-f-]{36}$/i.test(opportunity)) redirect("/opportunities");
  return <Workspace module="subscriptions" path={`/subscriptions/new?opportunity=${opportunity}`}>{async (person) => {
    if (!canInvest(person)) return <Recovery title="Investor account required" message="Only investor accounts can submit a subscription request." code="INVESTOR_ROLE_REQUIRED" />;
    const offer = await getOpportunity(person, opportunity);
    if (!offer) return <Recovery title="This opportunity is not open" message="It may have closed or its terms may have changed." code="OPPORTUNITY_UNAVAILABLE" />;
    return <>
      <Hero title="New subscription" subtitle="A few short questions, then a reviewer takes over." kind="investor" />
      <SubscribeFlow offer={{ id: offer.id, version: offer.version, title: offer.title, instrument: offer.instrument, currency: offer.currency, unitPrice: offer.unit_price, min: offer.min_units, max: offer.max_units }} />
    </>;
  }}</Workspace>;
}
